import { BadRequestException, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import type { PlanTopicRow } from '../catalog/catalog.types';
import {
  StudyPlan,
  StudyPlanTask,
  StudyTaskCompletionSource,
  StudyTaskStatus,
} from './study-plan.entity';
import { StudyPlanService } from './study-plan.service';

const NOW = new Date('2026-10-09T10:00:00Z'); // Friday 9 Oct 2026, IST

function topicRow(overrides: Partial<PlanTopicRow> = {}): PlanTopicRow {
  return {
    subject: 'Physics',
    chapter: 'Optics',
    scopeChapter: 'Optics',
    topic: 'Lenses',
    classLevel: 12,
    chapterMinutes: 90,
    chapterTopicCount: 3,
    learningStatus: 'PENDING',
    ...overrides,
  };
}

function user(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    className: '12',
    targetMonth: '2026-12',
    dailyMinutes: 120,
    ...overrides,
  };
}

function plan(overrides: Partial<StudyPlan> = {}): StudyPlan {
  return {
    id: 'p1',
    userId: 'u1',
    targetMonth: '2026-12',
    dailyMinutes: 120,
    paceWarning: false,
    requiredMinutesPerDay: 30,
    generatedAt: new Date('2026-10-01T00:00:00Z'),
    ...overrides,
  } as StudyPlan;
}

let seq = 0;
function task(overrides: Partial<StudyPlanTask> = {}): StudyPlanTask {
  seq += 1;
  return {
    id: `t${seq}`,
    planId: 'p1',
    date: '2026-10-09',
    subject: 'Physics',
    chapter: 'Optics',
    scopeChapter: 'Optics',
    topic: `Topic ${seq}`,
    estMinutes: 30,
    position: seq,
    status: StudyTaskStatus.PENDING,
    completedAt: null,
    completionSource: null,
    ...overrides,
  } as StudyPlanTask;
}

describe('StudyPlanService', () => {
  const plans = { findOne: jest.fn() };
  const tasks = { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
  const catalog = { getPlanTopics: jest.fn() };
  const users = { findById: jest.fn() };
  // what the transaction's repositories receive
  const txPlans = { create: jest.fn(), save: jest.fn() };
  const txTasks = { delete: jest.fn(), insert: jest.fn() };
  const dataSource = {
    transaction: jest.fn(async (work: (manager: unknown) => unknown) =>
      work({
        getRepository: (entity: unknown) =>
          entity === StudyPlan ? txPlans : txTasks,
      }),
    ),
  };
  let service: StudyPlanService;

  beforeEach(() => {
    jest.resetAllMocks();
    dataSource.transaction.mockImplementation(
      async (work: (manager: unknown) => unknown) =>
        work({
          getRepository: (entity: unknown) =>
            entity === StudyPlan ? txPlans : txTasks,
        }),
    );
    txPlans.create.mockImplementation((value: unknown) => value);
    txPlans.save.mockImplementation((value: object) =>
      Promise.resolve({ id: 'p1', ...value }),
    );
    tasks.save.mockImplementation((value: unknown) => Promise.resolve(value));
    users.findById.mockResolvedValue(user());
    plans.findOne.mockResolvedValue(null);
    tasks.find.mockResolvedValue([]);
    catalog.getPlanTopics.mockResolvedValue([]);
    service = new StudyPlanService(
      plans as never,
      tasks as never,
      catalog as never,
      users as never,
      dataSource as never,
    );
  });

  describe('generate', () => {
    it('needs a target month first', async () => {
      users.findById.mockResolvedValue(user({ targetMonth: null }));
      await expect(service.generate('u1', NOW)).rejects.toThrow(
        /target month/i,
      );
      expect(txPlans.save).not.toHaveBeenCalled();
    });

    it('refuses a target month that has already ended', async () => {
      users.findById.mockResolvedValue(user({ targetMonth: '2026-09' }));
      await expect(service.generate('u1', NOW)).rejects.toThrow(
        /already passed/i,
      );
    });

    it('builds a plan from today to the end of the target month and stores it', async () => {
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ topic: 'A' }),
        topicRow({ topic: 'B' }),
      ]);
      const result = await service.generate('u1', NOW);
      expect(result.planned).toBe(2);
      expect(result.keptCompleted).toBe(0);
      expect(result.plan).toMatchObject({
        targetMonth: '2026-12',
        dailyMinutes: 120,
        paceWarning: false,
        stale: false,
      });
      expect(txPlans.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'u1',
          targetMonth: '2026-12',
          dailyMinutes: 120,
          generatedAt: NOW,
        }),
      );
      const inserted = txTasks.insert.mock.calls[0][0] as Array<{
        date: string;
        topic: string;
        position: number;
        planId: string;
      }>;
      expect(inserted.map((t) => t.topic)).toEqual(['A', 'B']);
      expect(inserted.map((t) => t.position)).toEqual([0, 1]);
      expect(inserted.every((t) => t.planId === 'p1')).toBe(true);
      expect(
        inserted.every((t) => t.date >= '2026-10-09' && t.date <= '2026-12-31'),
      ).toBe(true);
    });

    it('leaves out topics the student has already completed through their answers', async () => {
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ topic: 'Done', learningStatus: 'COMPLETED' }),
        topicRow({ topic: 'Todo' }),
      ]);
      await service.generate('u1', NOW);
      const inserted = txTasks.insert.mock.calls[0][0] as Array<{
        topic: string;
      }>;
      expect(inserted.map((t) => t.topic)).toEqual(['Todo']);
    });

    it("only plans the student's class", async () => {
      users.findById.mockResolvedValue(user({ className: '11' }));
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ topic: 'Eleven', classLevel: 11 }),
        topicRow({ topic: 'Twelve', classLevel: 12 }),
      ]);
      await service.generate('u1', NOW);
      const inserted = txTasks.insert.mock.calls[0][0] as Array<{
        topic: string;
      }>;
      expect(inserted.map((t) => t.topic)).toEqual(['Eleven']);
    });

    it('keeps completed history on a rebuild and replaces only pending and skipped tasks', async () => {
      plans.findOne.mockResolvedValue(plan());
      tasks.find.mockResolvedValue([
        task({ topic: 'Ticked', status: StudyTaskStatus.COMPLETED }),
        task({ topic: 'Ticked too', status: StudyTaskStatus.COMPLETED }),
      ]);
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ topic: 'Ticked' }),
        topicRow({ topic: 'Fresh' }),
      ]);
      const result = await service.generate('u1', NOW);
      expect(result.keptCompleted).toBe(2);
      expect(tasks.find).toHaveBeenCalledWith({
        where: { planId: 'p1', status: StudyTaskStatus.COMPLETED },
      });
      expect(txTasks.delete).toHaveBeenCalledWith({
        planId: 'p1',
        status: In([StudyTaskStatus.PENDING, StudyTaskStatus.SKIPPED]),
      });
      // the plan row is reused, not duplicated
      expect(txPlans.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1' }),
      );
      // a ticked-off topic is not scheduled a second time
      const inserted = txTasks.insert.mock.calls[0][0] as Array<{
        topic: string;
      }>;
      expect(inserted.map((t) => t.topic)).toEqual(['Fresh']);
    });

    it('records a pace warning and what daily time would fit', async () => {
      users.findById.mockResolvedValue(
        user({ targetMonth: '2026-10', dailyMinutes: 30 }),
      );
      catalog.getPlanTopics.mockResolvedValue(
        Array.from({ length: 40 }, (_, i) => topicRow({ topic: `T${i}` })),
      );
      const result = await service.generate('u1', NOW);
      expect(result.plan.paceWarning).toBe(true);
      expect(result.plan.requiredMinutesPerDay).toBeGreaterThan(30);
      expect(result.planned).toBe(40);
      expect(result.unplacedTopics).toBe(0);
    });

    it('stores nothing to insert when there is nothing left to study', async () => {
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ learningStatus: 'COMPLETED' }),
      ]);
      const result = await service.generate('u1', NOW);
      expect(result.planned).toBe(0);
      expect(txTasks.insert).not.toHaveBeenCalled();
    });
  });

  describe('reading the plan', () => {
    it('reports no plan instead of an empty one', async () => {
      const today = await service.getToday('u1', NOW);
      expect(today).toMatchObject({ hasPlan: false, plan: null, tasks: [] });
      expect(catalog.getPlanTopics).not.toHaveBeenCalled();
    });

    it("shows today's progress as completed / total", async () => {
      plans.findOne.mockResolvedValue(plan());
      tasks.find.mockResolvedValue([
        task({ status: StudyTaskStatus.COMPLETED }),
        task({ status: StudyTaskStatus.COMPLETED }),
        task({ status: StudyTaskStatus.PENDING }),
        task({ date: '2026-10-10' }),
      ]);
      const view = await service.getToday('u1', NOW);
      expect(view.totals).toMatchObject({
        total: 3,
        completed: 2,
        percent: 67,
      });
    });

    it('marks a pending task done (AUTO) once the student has completed that topic for real', async () => {
      plans.findOne.mockResolvedValue(plan());
      const open = task({ topic: 'Lenses' });
      const skipped = task({
        topic: 'Lenses skipped',
        status: StudyTaskStatus.SKIPPED,
      });
      const stillOpen = task({ topic: 'Prisms' });
      tasks.find.mockResolvedValue([open, skipped, stillOpen]);
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ topic: 'Lenses', learningStatus: 'COMPLETED' }),
        topicRow({ topic: 'Lenses skipped', learningStatus: 'COMPLETED' }),
        topicRow({ topic: 'Prisms', learningStatus: 'IN_PROGRESS' }),
      ]);
      const view = await service.getToday('u1', NOW);
      expect(open.status).toBe(StudyTaskStatus.COMPLETED);
      expect(open.completionSource).toBe(StudyTaskCompletionSource.AUTO);
      expect(open.completedAt).toBe(NOW);
      expect(skipped.status).toBe(StudyTaskStatus.SKIPPED); // a skip is respected
      expect(stillOpen.status).toBe(StudyTaskStatus.PENDING);
      expect(tasks.save).toHaveBeenCalledWith([open]);
      expect(view.totals.completed).toBe(1);
    });

    it('does not touch the database when nothing changed', async () => {
      plans.findOne.mockResolvedValue(plan());
      tasks.find.mockResolvedValue([task({ topic: 'Prisms' })]);
      catalog.getPlanTopics.mockResolvedValue([
        topicRow({ topic: 'Prisms', learningStatus: 'IN_PROGRESS' }),
      ]);
      await service.getToday('u1', NOW);
      expect(tasks.save).not.toHaveBeenCalled();
    });

    it('flags a plan as stale when the target month or daily time was changed afterwards', async () => {
      plans.findOne.mockResolvedValue(plan({ targetMonth: '2026-12' }));
      users.findById.mockResolvedValue(user({ targetMonth: '2027-03' }));
      expect((await service.getToday('u1', NOW)).plan?.stale).toBe(true);
      users.findById.mockResolvedValue(user({ dailyMinutes: 60 }));
      expect((await service.getToday('u1', NOW)).plan?.stale).toBe(true);
      users.findById.mockResolvedValue(user());
      expect((await service.getToday('u1', NOW)).plan?.stale).toBe(false);
    });

    it('defaults the week to this week and the month to the target month', async () => {
      plans.findOne.mockResolvedValue(plan());
      tasks.find.mockResolvedValue([]);
      expect((await service.getWeek('u1', undefined, NOW)).weekStart).toBe(
        '2026-10-05',
      );
      expect((await service.getMonth('u1', undefined, NOW)).month).toBe(
        '2026-12',
      );
      expect((await service.getMonth('u1', '2026-10', NOW)).month).toBe(
        '2026-10',
      );
    });

    it('rejects a date that is not real', async () => {
      await expect(
        service.getWeek('u1', '2026-02-30', NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updateTask', () => {
    const owned = (overrides: Partial<StudyPlanTask> = {}) => {
      const t = task(overrides);
      (t as { plan?: unknown }).plan = { userId: 'u1' };
      tasks.findOne.mockResolvedValue(t);
      return t;
    };

    it("treats someone else's task exactly like a missing one", async () => {
      const t = task();
      (t as { plan?: unknown }).plan = { userId: 'someone-else' };
      tasks.findOne.mockResolvedValue(t);
      await expect(
        service.updateTask('u1', t.id, 'complete', NOW),
      ).rejects.toBeInstanceOf(NotFoundException);
      tasks.findOne.mockResolvedValue(null);
      await expect(
        service.updateTask('u1', 'nope', 'complete', NOW),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(tasks.save).not.toHaveBeenCalled();
    });

    it('ticks a task as MANUAL, which never touches topic status', async () => {
      const t = owned();
      const view = await service.updateTask('u1', t.id, 'complete', NOW);
      expect(t).toMatchObject({
        status: StudyTaskStatus.COMPLETED,
        completionSource: StudyTaskCompletionSource.MANUAL,
        completedAt: NOW,
      });
      expect(view.status).toBe('COMPLETED');
      expect(catalog.getPlanTopics).not.toHaveBeenCalled();
    });

    it('is idempotent: ticking a done task keeps its original source and time', async () => {
      const when = new Date('2026-10-08T00:00:00Z');
      const t = owned({
        status: StudyTaskStatus.COMPLETED,
        completionSource: StudyTaskCompletionSource.AUTO,
        completedAt: when,
      });
      await service.updateTask('u1', t.id, 'complete', NOW);
      expect(t.completionSource).toBe(StudyTaskCompletionSource.AUTO);
      expect(t.completedAt).toBe(when);
    });

    it('un-ticks a manual completion', async () => {
      const t = owned({
        status: StudyTaskStatus.COMPLETED,
        completionSource: StudyTaskCompletionSource.MANUAL,
        completedAt: NOW,
      });
      const view = await service.updateTask('u1', t.id, 'undo', NOW);
      expect(t).toMatchObject({
        status: StudyTaskStatus.PENDING,
        completionSource: null,
        completedAt: null,
      });
      expect(view.status).toBe('PENDING');
    });

    it('refuses to un-tick a topic the student really completed', async () => {
      const t = owned({
        status: StudyTaskStatus.COMPLETED,
        completionSource: StudyTaskCompletionSource.AUTO,
      });
      await expect(service.updateTask('u1', t.id, 'undo', NOW)).rejects.toThrow(
        /practice results/,
      );
      expect(tasks.save).not.toHaveBeenCalled();
    });

    it('skips a pending task and can bring a skipped one back', async () => {
      const t = owned();
      await service.updateTask('u1', t.id, 'skip', NOW);
      expect(t.status).toBe(StudyTaskStatus.SKIPPED);
      await service.updateTask('u1', t.id, 'undo', NOW);
      expect(t.status).toBe(StudyTaskStatus.PENDING);
    });

    it('will not skip a completed task', async () => {
      const t = owned({ status: StudyTaskStatus.COMPLETED });
      await expect(
        service.updateTask('u1', t.id, 'skip', NOW),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reports a pending task from an earlier day as OVERDUE', async () => {
      const t = owned({ date: '2026-10-01' });
      const view = await service.updateTask('u1', t.id, 'undo', NOW);
      expect(view.status).toBe('OVERDUE');
    });
  });
});
