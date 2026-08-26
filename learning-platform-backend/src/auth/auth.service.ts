import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import type { CookieOptions } from 'express';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { levelForXp } from '../users/user-progress';
import type { LoginDto, RegisterDto } from './auth.dto';
import { isPasswordValid, PASSWORD_POLICY_MESSAGE } from './password-policy';
import { AuthSession } from './auth-session.entity';
import type { AuthenticatedUser } from './auth.types';

export const SESSION_COOKIE_NAME = 'jee_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;
const TIMING_SAFE_FALLBACK_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export interface AuthResult {
  user: AuthenticatedUser;
  sessionToken: string;
  expiresAt: Date;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdminFromEnv();
  }

  async register(input: RegisterDto): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    // If this email matches the configured admin email, create as admin.
    const configuredAdminEmail = this.normalizeEmail(
      this.configService.get<string>('ADMIN_EMAIL') ?? '',
    );
    const role =
      configuredAdminEmail && email === configuredAdminEmail
        ? 'admin'
        : 'student';

    const user = this.usersRepository.create({
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      role,
    });

    try {
      await this.usersRepository.save(user);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      throw error;
    }

    if (role === 'admin') {
      this.logger.log(`Admin account created for ${email}`);
    }

    return this.createAuthenticatedSession(user);
  }

  async login(input: LoginDto): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);
    const user = await this.usersRepository.findOne({ where: { email } });
    const passwordHash = user?.passwordHash ?? TIMING_SAFE_FALLBACK_HASH;
    const matches = await bcrypt.compare(input.password, passwordHash);

    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createAuthenticatedSession(user);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (!sessionToken) {
      return;
    }

    const session = await this.sessionsRepository.findOne({
      where: { tokenHash: this.hashToken(sessionToken) },
    });
    if (session && !session.revokedAt) {
      session.revokedAt = new Date();
      await this.sessionsRepository.save(session);
    }
  }

  async getUserFromSessionToken(
    sessionToken: string,
  ): Promise<AuthenticatedUser | null> {
    const session = await this.sessionsRepository.findOne({
      where: { tokenHash: this.hashToken(sessionToken) },
      relations: { user: true },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      if (session && !session.revokedAt) {
        session.revokedAt = new Date();
        await this.sessionsRepository.save(session);
      }
      return null;
    }

    return this.toAuthenticatedUser(session.user);
  }

  getCookieOptions(): CookieOptions {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS,
    };
  }

  getExpiredCookieOptions(): CookieOptions {
    const options = this.getCookieOptions();
    return { ...options, maxAge: 0 };
  }

  toAuthenticatedUser(user: User): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'student',
      xp: user.xp,
      level: levelForXp(user.xp),
      streak: user.streak,
    };
  }

  private async createAuthenticatedSession(user: User): Promise<AuthResult> {
    const sessionToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const session = this.sessionsRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(sessionToken),
      expiresAt,
      revokedAt: null,
      lastSeenAt: new Date(),
    });
    await this.sessionsRepository.save(session);

    return {
      user: this.toAuthenticatedUser(user),
      sessionToken,
      expiresAt,
    };
  }

  /**
   * If ADMIN_EMAIL and ADMIN_PASSWORD are set in env, ensure an admin account
   * exists (creates it if missing). This gives teams a reliable bootstrap path
   * instead of being locked out of admin functionality.
   */
  private async seedAdminFromEnv(): Promise<void> {
    const email = this.normalizeEmail(
      this.configService.get<string>('ADMIN_EMAIL') ?? '',
    );
    const password = this.configService.get<string>('ADMIN_PASSWORD') ?? '';
    const name =
      this.configService.get<string>('ADMIN_NAME') ?? 'Administrator';

    if (!email || !password) {
      return;
    }

    // The seeded admin must satisfy the same policy as self-registration;
    // refuse to boot with a weak bootstrap credential instead of silently
    // creating an easy compromise target.
    if (!isPasswordValid(password)) {
      throw new Error(
        `ADMIN_PASSWORD does not satisfy the password policy: ${PASSWORD_POLICY_MESSAGE}`,
      );
    }

    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await this.usersRepository.save(existing);
        this.logger.log(`Promoted ${email} to admin from environment config.`);
      }
      return;
    }

    const user = this.usersRepository.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      role: 'admin',
    });
    await this.usersRepository.save(user);
    this.logger.log(
      `Seeded admin account for ${email} from environment config.`,
    );
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    );
  }
}
