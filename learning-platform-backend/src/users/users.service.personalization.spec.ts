import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

const NOW = new Date('2026-10-09T10:00:00Z'); // October 2026 in IST

function student(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    className: null as string | null,
    stream: null as string | null,
    targetMonth: null as string | null,
    dailyMinutes: 120,
    personalizationCompletedAt: null as Date | null,
    ...overrides,
  };
}

describe('UsersService.updatePersonalization', () => {
  const userRepository = { findOne: jest.fn(), save: jest.fn() };
  let service: UsersService;

  beforeEach(() => {
    jest.resetAllMocks();
    userRepository.save.mockImplementation((user: unknown) =>
      Promise.resolve(user),
    );
    service = new UsersService(userRepository as never);
  });

  it('completes the profile once class, stream and target month are all set', async () => {
    userRepository.findOne.mockResolvedValue(student());
    const result = await service.updatePersonalization(
      'user-1',
      { className: '12', stream: 'Science (PCM)', targetMonth: '2026-12' },
      NOW,
    );
    expect(result.user).toMatchObject({
      className: '12',
      stream: 'Science (PCM)',
      targetMonth: '2026-12',
      personalizationCompletedAt: NOW,
    });
    expect(result.targetMonthChanged).toBe(true);
  });

  it('does not mark the profile complete while a field is still missing', async () => {
    userRepository.findOne.mockResolvedValue(student());
    const result = await service.updatePersonalization(
      'user-1',
      { className: '11', dailyMinutes: 90 },
      NOW,
    );
    expect(result.user.className).toBe('11');
    expect(result.user.dailyMinutes).toBe(90);
    expect(result.user.personalizationCompletedAt).toBeNull();
    expect(result.targetMonthChanged).toBe(false);
  });

  it('never resets the completion time on later edits', async () => {
    const earlier = new Date('2026-09-01T00:00:00Z');
    userRepository.findOne.mockResolvedValue(
      student({
        className: '12',
        stream: 'Science (PCM)',
        targetMonth: '2026-12',
        personalizationCompletedAt: earlier,
      }),
    );
    const result = await service.updatePersonalization(
      'user-1',
      { dailyMinutes: 60 },
      NOW,
    );
    expect(result.user.personalizationCompletedAt).toBe(earlier);
  });

  it('rejects a new target month in the past and saves nothing', async () => {
    userRepository.findOne.mockResolvedValue(student());
    await expect(
      service.updatePersonalization('user-1', { targetMonth: '2026-09' }, NOW),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('rejects a target month more than 24 months away', async () => {
    userRepository.findOne.mockResolvedValue(student());
    await expect(
      service.updatePersonalization('user-1', { targetMonth: '2029-01' }, NOW),
    ).rejects.toThrow(/24 months/);
  });

  it('flags a real change of month so the plan can be rebuilt', async () => {
    userRepository.findOne.mockResolvedValue(
      student({
        className: '12',
        stream: 'Science (PCM)',
        targetMonth: '2026-12',
      }),
    );
    const changed = await service.updatePersonalization(
      'user-1',
      { targetMonth: '2027-03' },
      NOW,
    );
    expect(changed.targetMonthChanged).toBe(true);
    expect(changed.user.targetMonth).toBe('2027-03');
  });

  it('does not flag re-sending the same month, and accepts it even after it has passed', async () => {
    userRepository.findOne.mockResolvedValue(
      student({ targetMonth: '2026-06', className: '12' }),
    );
    const result = await service.updatePersonalization(
      'user-1',
      { targetMonth: '2026-06', stream: 'Science (PCM)' },
      NOW,
    );
    expect(result.targetMonthChanged).toBe(false);
    expect(result.user.stream).toBe('Science (PCM)');
  });

  it('only ever loads and saves the caller, never another user', async () => {
    userRepository.findOne.mockResolvedValue(student());
    await service.updatePersonalization('user-1', { className: '12' }, NOW);
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });

  it('throws NotFoundException for an unknown user', async () => {
    userRepository.findOne.mockResolvedValue(null);
    await expect(
      service.updatePersonalization('missing', { className: '12' }, NOW),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
