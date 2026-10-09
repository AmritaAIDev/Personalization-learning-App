import {
  addDays,
  dateRange,
  daysBetween,
  isDate,
  lastDayOfMonth,
  monthOf,
  todayIST,
  weekStart,
} from './plan-dates';

describe('todayIST', () => {
  it('is the IST calendar day, not the UTC one', () => {
    expect(todayIST(new Date('2026-10-09T10:00:00Z'))).toBe('2026-10-09');
    // 20:00 UTC is already the next morning in India
    expect(todayIST(new Date('2026-10-09T20:00:00Z'))).toBe('2026-10-10');
    expect(todayIST(new Date('2026-12-31T19:00:00Z'))).toBe('2027-01-01');
  });
});

describe('date arithmetic', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29'); // leap year
  });

  it('counts whole days between dates in both directions', () => {
    expect(daysBetween('2026-10-09', '2026-10-09')).toBe(0);
    expect(daysBetween('2026-10-09', '2026-12-31')).toBe(83);
    expect(daysBetween('2026-12-31', '2026-10-09')).toBe(-83);
  });

  it('finds the last day of any month, including February in leap years', () => {
    expect(lastDayOfMonth('2026-10')).toBe('2026-10-31');
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28');
    expect(lastDayOfMonth('2028-02')).toBe('2028-02-29');
    expect(lastDayOfMonth('2026-12')).toBe('2026-12-31');
    expect(lastDayOfMonth('2026-04')).toBe('2026-04-30');
  });

  it('names the month of a date', () => {
    expect(monthOf('2026-10-09')).toBe('2026-10');
  });
});

describe('weekStart (Monday-based)', () => {
  it.each([
    ['2026-10-05', '2026-10-05'], // Monday
    ['2026-10-09', '2026-10-05'], // Friday
    ['2026-10-11', '2026-10-05'], // Sunday belongs to the week that began Monday
    ['2026-10-12', '2026-10-12'], // next Monday
    ['2026-01-01', '2025-12-29'], // week spans the year boundary
  ])('%s starts the week of %s', (date, monday) => {
    expect(weekStart(date)).toBe(monday);
  });
});

describe('dateRange', () => {
  it('lists every day inclusive', () => {
    expect(dateRange('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(dateRange('2026-10-09', '2026-10-09')).toEqual(['2026-10-09']);
  });

  it('is empty when the end is before the start', () => {
    expect(dateRange('2026-10-10', '2026-10-09')).toEqual([]);
  });
});

describe('isDate', () => {
  it('accepts real dates only', () => {
    expect(isDate('2026-10-09')).toBe(true);
    expect(isDate('2028-02-29')).toBe(true);
    for (const bad of [
      '2026-02-30',
      '2026-13-01',
      '2026-10-32',
      '10-09-2026',
      '2026-1-9',
      '',
    ]) {
      expect(isDate(bad)).toBe(false);
    }
  });
});
