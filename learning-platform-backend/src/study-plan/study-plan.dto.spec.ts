import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MonthQueryDto, UpdateTaskDto, WeekQueryDto } from './study-plan.dto';

async function problems<T extends object>(
  type: new () => T,
  payload: Record<string, unknown>,
): Promise<string[]> {
  return (await validate(plainToInstance(type, payload))).map(
    (error) => error.property,
  );
}

describe('UpdateTaskDto', () => {
  it.each(['complete', 'undo', 'skip'])('accepts %s', async (action) => {
    expect(await problems(UpdateTaskDto, { action })).toEqual([]);
  });

  it.each([{}, { action: 'delete' }, { action: 'COMPLETE' }, { action: 1 }])(
    'rejects %j',
    async (payload) => {
      expect(await problems(UpdateTaskDto, payload)).toContain('action');
    },
  );
});

describe('WeekQueryDto', () => {
  it('accepts no date or a YYYY-MM-DD date', async () => {
    expect(await problems(WeekQueryDto, {})).toEqual([]);
    expect(await problems(WeekQueryDto, { d: '2026-10-09' })).toEqual([]);
  });

  it.each(['2026-10', '09-10-2026', 'today', '2026-1-9'])(
    'rejects %s',
    async (d) => {
      expect(await problems(WeekQueryDto, { d })).toContain('d');
    },
  );
});

describe('MonthQueryDto', () => {
  it('accepts no month or a YYYY-MM month', async () => {
    expect(await problems(MonthQueryDto, {})).toEqual([]);
    expect(await problems(MonthQueryDto, { m: '2026-12' })).toEqual([]);
  });

  it.each(['2026-13', '2026-00', '2026-1', 'December', '2026-12-01'])(
    'rejects %s',
    async (m) => {
      expect(await problems(MonthQueryDto, { m })).toContain('m');
    },
  );
});
