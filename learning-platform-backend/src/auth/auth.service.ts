import {
  ConflictException,
  Injectable,
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
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly sessionsRepository: Repository<AuthSession>,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterDto): Promise<AuthResult> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const user = this.usersRepository.create({
      name: input.name.trim(),
      email,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      role: 'student',
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
