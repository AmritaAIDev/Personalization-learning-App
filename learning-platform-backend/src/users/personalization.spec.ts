import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  currentMonthIST,
  DEFAULT_DAILY_MINUTES,
  EMPTY_PERSONALIZATION,
  monthsBetween,
  targetMonthProblem,
  toPersonalization,
} from './personalization';
import { UpdatePersonalizationDto } from './update-personalization.dto';

describe('currentMonthIST', () => {
  it('uses the IST calendar month, not the UTC one', () => {
    // 2026-10-31 20:00 UTC is already 2026-11-01 01:30 in India
    expect(currentMonthIST(new Date('2026-10-31T20:00:00Z'))).toBe('2026-11');
    // 2026-10-31 18:00 UTC is 23:30 IST, still October
    expect(currentMonthIST(new Date('2026-10-31T18:00:00Z'))).toBe('2026-10');
  });

  it('rolls the year over correctly', () => {
    expect(currentMonthIST(new Date('2026-12-31T19:00:00Z'))).toBe('2027-01');
  });
});

describe('monthsBetween', () => {
  it('counts whole months, across years and in both directions', () => {
    expect(monthsBetween('2026-10', '2026-10')).toBe(0);
    expect(monthsBetween('2026-10', '2026-12')).toBe(2);
    expect(monthsBetween('2026-11', '2027-02')).toBe(3);
    expect(monthsBetween('2026-10', '2026-08')).toBe(-2);
  });
});

describe('targetMonthProblem', () => {
  const now = new Date('2026-10-09T10:00:00Z'); // October 2026 in IST

  it.each(['2026-10', '2026-12', '2027-01', '2028-10'])(
    'accepts %s (this month up to 24 months ahead)',
    (month) => {
      expect(targetMonthProblem(month, now)).toBeNull();
    },
  );

  it('rejects the past', () => {
    expect(targetMonthProblem('2026-09', now)).toBe(
      'Target month cannot be in the past.',
    );
    expect(targetMonthProblem('2025-12', now)).toMatch(/past/);
  });

  it('rejects anything more than 24 months ahead', () => {
    expect(targetMonthProblem('2028-11', now)).toMatch(/24 months/);
  });

  it('rejects malformed values, including impossible months', () => {
    for (const bad of [
      '2026-13',
      '2026-00',
      '2026-1',
      '26-10',
      'December',
      '',
    ]) {
      expect(targetMonthProblem(bad, now)).toBe(
        'Target month must be in YYYY-MM format.',
      );
    }
  });

  it('judges "this month" by the IST calendar, so a late-evening UTC time is next month', () => {
    const lateOctoberUtc = new Date('2026-10-31T20:00:00Z'); // already November in IST
    expect(targetMonthProblem('2026-10', lateOctoberUtc)).toMatch(/past/);
    expect(targetMonthProblem('2026-11', lateOctoberUtc)).toBeNull();
  });
});

describe('toPersonalization', () => {
  const base = {
    className: '12',
    stream: 'Science (PCM)',
    targetMonth: '2026-12',
    dailyMinutes: 90,
    personalizationCompletedAt: new Date('2026-10-09T00:00:00Z'),
  };

  it('maps a complete profile', () => {
    expect(toPersonalization(base)).toEqual({
      className: '12',
      stream: 'Science (PCM)',
      targetMonth: '2026-12',
      dailyMinutes: 90,
      completedAt: '2026-10-09T00:00:00.000Z',
    });
  });

  it('reads values that are no longer valid options as "not set"', () => {
    const result = toPersonalization({
      ...base,
      className: 'Grade 9',
      stream: 'Biology',
    });
    expect(result.className).toBeNull();
    expect(result.stream).toBeNull();
  });

  it('gives a fresh student the defaults', () => {
    expect(
      toPersonalization({
        className: null,
        stream: null,
        targetMonth: null,
        dailyMinutes: DEFAULT_DAILY_MINUTES,
        personalizationCompletedAt: null,
      }),
    ).toEqual(EMPTY_PERSONALIZATION);
    expect(EMPTY_PERSONALIZATION.dailyMinutes).toBe(120);
  });
});

describe('UpdatePersonalizationDto', () => {
  const check = async (payload: Record<string, unknown>) =>
    (await validate(plainToInstance(UpdatePersonalizationDto, payload))).map(
      (error) => error.property,
    );

  it('accepts a full valid profile and an empty patch', async () => {
    expect(
      await check({
        className: '12',
        stream: 'Science (PCM)',
        targetMonth: '2026-12',
        dailyMinutes: 120,
      }),
    ).toEqual([]);
    expect(await check({})).toEqual([]);
    expect(await check({ className: 'Dropper' })).toEqual([]);
  });

  it.each([
    [{ className: '10' }, 'className'],
    [{ className: 12 }, 'className'],
    [{ stream: 'Biology' }, 'stream'],
    [{ targetMonth: '2026-13' }, 'targetMonth'],
    [{ targetMonth: 'December 2026' }, 'targetMonth'],
    [{ targetMonth: 202612 }, 'targetMonth'],
    [{ dailyMinutes: 29 }, 'dailyMinutes'],
    [{ dailyMinutes: 601 }, 'dailyMinutes'],
    [{ dailyMinutes: 90.5 }, 'dailyMinutes'],
    [{ dailyMinutes: '90' }, 'dailyMinutes'],
  ])('rejects %j', async (payload, property) => {
    expect(await check(payload)).toContain(property);
  });

  it('accepts the daily-minutes bounds', async () => {
    expect(await check({ dailyMinutes: 30 })).toEqual([]);
    expect(await check({ dailyMinutes: 600 })).toEqual([]);
  });
});
