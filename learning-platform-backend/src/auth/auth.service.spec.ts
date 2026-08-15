import * as bcrypt from 'bcryptjs';

jest.setTimeout(30000);
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const usersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const sessionsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const configService = {
    get: jest.fn(),
  };
  let service: AuthService;

  beforeEach(() => {
    jest.resetAllMocks();
    configService.get.mockReturnValue('test');
    service = new AuthService(
      usersRepository as never,
      sessionsRepository as never,
      configService as never,
    );
  });

  it('hashes a registered password and persists only a hashed session token', async () => {
    usersRepository.findOne.mockResolvedValue(null);
    usersRepository.create.mockImplementation((data) => ({
      id: 'student-1',
      xp: 0,
      level: 1,
      streak: 0,
      ...data,
    }));
    usersRepository.save.mockImplementation(async (user) => user);
    sessionsRepository.create.mockImplementation((data) => ({
      id: 'session-1',
      ...data,
    }));
    sessionsRepository.save.mockImplementation(async (session) => session);

    const result = await service.register({
      name: '  Ada Lovelace ',
      email: 'ADA@EXAMPLE.COM ',
      password: 'StrongPassword1',
    });

    const persistedUser = usersRepository.save.mock.calls[0][0] as {
      passwordHash: string;
      email: string;
      name: string;
    };
    const persistedSession = sessionsRepository.save.mock.calls[0][0] as {
      tokenHash: string;
    };

    expect(persistedUser.name).toBe('Ada Lovelace');
    expect(persistedUser.email).toBe('ada@example.com');
    expect(persistedUser.passwordHash).not.toBe('StrongPassword1');
    await expect(
      bcrypt.compare('StrongPassword1', persistedUser.passwordHash),
    ).resolves.toBe(true);
    expect(persistedSession.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(persistedSession.tokenHash).not.toBe(result.sessionToken);
    expect(result.user).toMatchObject({
      id: 'student-1',
      email: 'ada@example.com',
      role: 'student',
    });
  });

  it('rejects duplicate registration before creating an account', async () => {
    usersRepository.findOne.mockResolvedValue({ id: 'existing-user' });

    await expect(
      service.register({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'StrongPassword1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(usersRepository.create).not.toHaveBeenCalled();
  });

  it('rejects an invalid login without creating a session', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 'student-1',
      passwordHash: await bcrypt.hash('AnotherPassword1', 10),
    });

    await expect(
      service.login({ email: 'ada@example.com', password: 'WrongPassword1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessionsRepository.save).not.toHaveBeenCalled();
  });
});
