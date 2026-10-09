import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CatalogService } from '../catalog/catalog.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { isDate, lastDayOfMonth, monthOf, todayIST } from './plan-dates';
import { generatePlan } from './plan-generator';
import { selectTopicsToPlan, topicKey } from './plan-topics';
import {
  buildMonthView,
  buildTodayView,
  buildWeekView,
  toTaskView,
} from './plan-views';
import type { TaskAction } from './study-plan.dto';
import {
  StudyPlan,
  StudyPlanTask,
  StudyTaskCompletionSource,
  StudyTaskStatus,
} from './study-plan.entity';
import type {
  GenerateResult,
  MonthView,
  PlanSummary,
  StudyTaskView,
  TodayView,
  WeekView,
} from './study-plan.types';

const taskKey = (task: Pick<StudyPlanTask, 'subject' | 'chapter' | 'topic'>) =>
  topicKey(task.subject, task.chapter, task.topic);

/**
 * The student's personal study plan: builds it from their remaining topics and
 * target month, and serves the Today / Week / Month views.
 *
 * - **Rebuilding keeps history.** Completed tasks stay (the weekly chart and
 *   planned-vs-completed need them); pending and skipped ones are replaced by a
 *   fresh schedule of what is still left.
 * - **Progress is real.** A task flips to Completed (source AUTO) on read when
 *   the student's own answers have completed the topic. Ticking a task
 *   (source MANUAL) only records that the student did it; it never changes
 *   topic status or mastery.
 */
@Injectable()
export class StudyPlanService {
  constructor(
    @InjectRepository(StudyPlan) private readonly plans: Repository<StudyPlan>,
    @InjectRepository(StudyPlanTask)
    private readonly tasks: Repository<StudyPlanTask>,
    private readonly catalog: CatalogService,
    private readonly users: UsersService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Builds or rebuilds the plan from today to the end of the target month. */
  async generate(
    userId: string,
    now: Date = new Date(),
  ): Promise<GenerateResult> {
    const user = await this.users.findById(userId);
    if (!user.targetMonth) {
      throw new BadRequestException(
        'Choose a target month before building your study plan.',
      );
    }
    const today = todayIST(now);
    const endDate = lastDayOfMonth(user.targetMonth);
    if (endDate < today) {
      throw new BadRequestException(
        'Your target month has already passed. Choose a new target month.',
      );
    }

    const existing = await this.plans.findOne({ where: { userId } });
    const done = existing
      ? await this.tasks.find({
          where: { planId: existing.id, status: StudyTaskStatus.COMPLETED },
        })
      : [];
    const rows = await this.catalog.getPlanTopics(userId);
    const generated = generatePlan({
      topics: selectTopicsToPlan(
        rows,
        user.className,
        new Set(done.map(taskKey)),
      ),
      startDate: today,
      endDate,
      dailyMinutes: user.dailyMinutes,
      reservedByDate: reservedMinutes(done, today),
    });

    const saved = await this.dataSource.transaction(async (manager) => {
      const planRepo = manager.getRepository(StudyPlan);
      const taskRepo = manager.getRepository(StudyPlanTask);
      const plan = await planRepo.save(
        planRepo.create({
          ...(existing ? { id: existing.id } : {}),
          userId,
          targetMonth: user.targetMonth as string,
          dailyMinutes: user.dailyMinutes,
          paceWarning: generated.paceWarning,
          requiredMinutesPerDay: generated.requiredMinutesPerDay,
          generatedAt: now,
        }),
      );
      // Everything not yet done is rebuilt; completed history stays.
      await taskRepo.delete({
        planId: plan.id,
        status: In([StudyTaskStatus.PENDING, StudyTaskStatus.SKIPPED]),
      });
      if (generated.tasks.length > 0) {
        await taskRepo.insert(
          generated.tasks.map((task, position) => ({
            planId: plan.id,
            date: task.date,
            subject: task.subject,
            chapter: task.chapter,
            scopeChapter: task.scopeChapter,
            topic: task.topic,
            estMinutes: task.estMinutes,
            position,
          })),
        );
      }
      return plan;
    });

    return {
      plan: this.summarize(saved, user),
      planned: generated.tasks.length,
      keptCompleted: done.length,
      unplacedTopics: generated.unplacedTopics,
    };
  }

  async getToday(userId: string, now: Date = new Date()): Promise<TodayView> {
    const today = todayIST(now);
    const { plan, tasks, user } = await this.loadSynced(userId, now);
    return buildTodayView(
      tasks,
      plan ? this.summarize(plan, user) : null,
      today,
    );
  }

  async getWeek(
    userId: string,
    date: string | undefined,
    now: Date = new Date(),
  ): Promise<WeekView> {
    if (date !== undefined && !isDate(date)) {
      throw new BadRequestException(
        'd must be a real date in YYYY-MM-DD format.',
      );
    }
    const today = todayIST(now);
    const { plan, tasks, user } = await this.loadSynced(userId, now);
    return buildWeekView(
      tasks,
      plan ? this.summarize(plan, user) : null,
      date ?? today,
      today,
    );
  }

  async getMonth(
    userId: string,
    month: string | undefined,
    now: Date = new Date(),
  ): Promise<MonthView> {
    const today = todayIST(now);
    const { plan, tasks, user } = await this.loadSynced(userId, now);
    return buildMonthView(
      tasks,
      plan ? this.summarize(plan, user) : null,
      month ?? plan?.targetMonth ?? monthOf(today),
      today,
    );
  }

  /** Tick, un-tick or skip one task. Only the owner's tasks are reachable. */
  async updateTask(
    userId: string,
    taskId: string,
    action: TaskAction,
    now: Date = new Date(),
  ): Promise<StudyTaskView> {
    const task = await this.tasks.findOne({
      where: { id: taskId },
      relations: { plan: true },
    });
    // Someone else's task looks exactly like a missing one.
    if (!task || task.plan.userId !== userId) {
      throw new NotFoundException('Task not found.');
    }

    if (action === 'complete') {
      if (task.status !== StudyTaskStatus.COMPLETED) {
        task.status = StudyTaskStatus.COMPLETED;
        task.completionSource = StudyTaskCompletionSource.MANUAL;
        task.completedAt = now;
      }
    } else if (action === 'skip') {
      if (task.status === StudyTaskStatus.COMPLETED) {
        throw new BadRequestException(
          'A completed task cannot be skipped. Undo it first.',
        );
      }
      task.status = StudyTaskStatus.SKIPPED;
    } else if (task.status === StudyTaskStatus.COMPLETED) {
      if (task.completionSource === StudyTaskCompletionSource.AUTO) {
        throw new BadRequestException(
          'This topic counts as completed from your practice results, so it cannot be un-ticked.',
        );
      }
      this.reopen(task);
    } else if (task.status === StudyTaskStatus.SKIPPED) {
      this.reopen(task);
    }

    const saved = await this.tasks.save(task);
    return toTaskView(saved, todayIST(now));
  }

  private reopen(task: StudyPlanTask): void {
    task.status = StudyTaskStatus.PENDING;
    task.completionSource = null;
    task.completedAt = null;
  }

  private summarize(plan: StudyPlan, user: User): PlanSummary {
    return {
      targetMonth: plan.targetMonth,
      dailyMinutes: plan.dailyMinutes,
      generatedAt: plan.generatedAt.toISOString(),
      paceWarning: plan.paceWarning,
      requiredMinutesPerDay: plan.requiredMinutesPerDay,
      stale:
        plan.targetMonth !== user.targetMonth ||
        plan.dailyMinutes !== user.dailyMinutes,
    };
  }

  /**
   * Loads the student's tasks, first flipping any pending task whose topic the
   * student has now completed through real answers to Completed (source AUTO).
   */
  private async loadSynced(
    userId: string,
    now: Date,
  ): Promise<{ plan: StudyPlan | null; tasks: StudyPlanTask[]; user: User }> {
    const user = await this.users.findById(userId);
    const plan = await this.plans.findOne({ where: { userId } });
    if (!plan) return { plan: null, tasks: [], user };

    const tasks = await this.tasks.find({
      where: { planId: plan.id },
      order: { date: 'ASC', position: 'ASC' },
    });
    const open = tasks.filter(
      (task) => task.status === StudyTaskStatus.PENDING,
    );
    if (open.length > 0) {
      const completed = new Set(
        (await this.catalog.getPlanTopics(userId))
          .filter((row) => row.learningStatus === 'COMPLETED')
          .map((row) => topicKey(row.subject, row.chapter, row.topic)),
      );
      const flipped = open.filter((task) => completed.has(taskKey(task)));
      for (const task of flipped) {
        task.status = StudyTaskStatus.COMPLETED;
        task.completionSource = StudyTaskCompletionSource.AUTO;
        task.completedAt = now;
      }
      if (flipped.length > 0) await this.tasks.save(flipped);
    }
    return { plan, tasks, user };
  }
}

/** Minutes ticked tasks already take on each day from `from` on, so a rebuild does not double them. */
function reservedMinutes(
  done: ReadonlyArray<Pick<StudyPlanTask, 'date' | 'estMinutes'>>,
  from: string,
): Record<string, number> {
  const reserved: Record<string, number> = {};
  for (const task of done) {
    const date = String(task.date);
    if (date < from) continue;
    reserved[date] = (reserved[date] ?? 0) + task.estMinutes;
  }
  return reserved;
}
