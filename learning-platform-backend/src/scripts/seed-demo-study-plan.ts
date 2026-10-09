import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../app.module';
import { StudyPlanService } from '../study-plan/study-plan.service';
import { monthOf, todayIST } from '../study-plan/plan-dates';
import { User } from '../users/user.entity';

/**
 * Gives the demo student (created by `seed:demo-history`) a personalised
 * profile and a real study plan with a mix of states: a few tasks ticked, one
 * skipped, the rest pending. Everything goes through the real service, so the
 * dashboard, /plan and /progress show exactly what a student would see.
 *
 * Needs the syllabus (`seed:syllabus`). Safe to re-run: a rebuild keeps ticked
 * tasks. Refuses a cloud database unless ALLOW_CLOUD_DEMO_SEED=true.
 */
const DEMO_EMAIL = (
  process.env.DEMO_USER_EMAIL ?? 'demo.student@jeeai.local'
).toLowerCase();
const TARGET_MONTHS_AHEAD = 3;
const TICKED = 3;

/** `YYYY-MM` that is `delta` months after `month`. */
function monthsAhead(month: string, delta: number): string {
  const [year, number] = month.split('-').map(Number);
  const index = year * 12 + (number - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
}

function assertSafeTarget(): void {
  const url = process.env.DATABASE_URL ?? '';
  const isCloud = /neon\.tech|supabase\.co|rds\.amazonaws\.com/i.test(url);
  if (isCloud && process.env.ALLOW_CLOUD_DEMO_SEED !== 'true') {
    throw new Error(
      'DATABASE_URL points at a cloud database. Demo data is meant for local databases; set ALLOW_CLOUD_DEMO_SEED=true only if you really mean it.',
    );
  }
}

async function main(): Promise<void> {
  assertSafeTarget();
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const users = app.get<Repository<User>>(getRepositoryToken(User));
    const plans = app.get(StudyPlanService);

    const user = await users.findOne({ where: { email: DEMO_EMAIL } });
    if (!user) {
      throw new Error(
        `Demo student ${DEMO_EMAIL} not found. Run "npm run seed:demo-history" first.`,
      );
    }

    user.className = '12';
    user.stream = 'Science (PCM)';
    user.targetMonth = monthsAhead(monthOf(todayIST()), TARGET_MONTHS_AHEAD);
    user.dailyMinutes = 120;
    user.personalizationCompletedAt ??= new Date();
    await users.save(user);

    const result = await plans.generate(user.id);

    // Tick and skip only on the first run, so re-running does not keep ticking.
    const tasks =
      result.keptCompleted >= TICKED
        ? []
        : (await plans.getWeek(user.id, undefined)).days.flatMap(
            (day) => day.tasks,
          );
    let ticked = 0;
    for (const task of tasks.slice(0, TICKED)) {
      await plans.updateTask(user.id, task.id, 'complete');
      ticked += 1;
    }
    const skipTarget = tasks[TICKED];
    if (skipTarget) {
      await plans.updateTask(user.id, skipTarget.id, 'skip');
    }

    console.log(
      `Demo study plan ready for ${user.email}: ${result.planned} tasks up to ${user.targetMonth}, ${ticked} newly ticked, ${result.keptCompleted} already done${skipTarget ? ', 1 skipped' : ''}.`,
    );
    if (result.planned === 0) {
      console.warn(
        'No topics were planned. Run "npm run seed:syllabus" (and publish questions) first.',
      );
    }
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
