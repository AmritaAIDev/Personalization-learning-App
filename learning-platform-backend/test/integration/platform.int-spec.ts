import './setup-env';

import type { INestApplication } from '@nestjs/common';
import type { App } from 'supertest/types';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppModule } from '../../src/app.module';
import { SESSION_COOKIE_NAME } from '../../src/auth/auth.service';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import {
  CORRECT_OPTION,
  TEST_CHAPTER,
  TEST_SUBJECT,
  TEST_TOPIC,
  cleanupTestData,
  cleanupUser,
  seedLevelOneQuestions,
} from './seed.util';

const ALLOWED_ORIGIN = 'http://localhost:3000';
const LEARNER_EMAIL = `integration-learner-${Date.now()}@example.test`;
const LEARNER_PASSWORD = 'IntegrationPass123';

/**
 * Exercises the real HTTP stack against a real PostgreSQL database. The unit
 * suites mock their repositories, so this is the only place that proves
 * migrations, entities, guards, and adaptive persistence agree with each other.
 */
describe('Platform integration (real database)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let sessionCookie: string;

  /** Keeps supertest's server type from widening to `any` at every call site. */
  const httpRequest = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mirror the production bootstrap for the layers this suite asserts on.
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    dataSource = app.get<DataSource>(getDataSourceToken());
    await cleanupTestData(dataSource);
    await cleanupUser(dataSource, LEARNER_EMAIL);
    await seedLevelOneQuestions(dataSource, 8);
  }, 60_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await cleanupTestData(dataSource);
      await cleanupUser(dataSource, LEARNER_EMAIL);
    }
    await app?.close();
  }, 60_000);

  describe('deployment surface', () => {
    it('reports a healthy database through the readiness probe', async () => {
      const response = await httpRequest().get('/health').expect(200);

      expect(response.body).toMatchObject({ status: 'ok', database: 'ok' });
    });

    it('has every migration applied, leaving nothing pending', async () => {
      const applied = await dataSource.query<Array<{ name: string }>>(
        'SELECT name FROM migrations',
      );
      expect(applied.length).toBeGreaterThan(0);
      await expect(dataSource.showMigrations()).resolves.toBe(false);
    });
  });

  describe('authentication boundary', () => {
    it('rejects an unauthenticated read of learner data', async () => {
      await httpRequest().get('/api/learning/dashboard').expect(401);
    });

    it('rejects an unsafe request from a foreign browser origin', async () => {
      await httpRequest()
        .post('/api/auth/login')
        .set('Origin', 'https://attacker.example')
        .send({ email: LEARNER_EMAIL, password: LEARNER_PASSWORD })
        .expect(403);
    });

    it('registers a learner and issues an HttpOnly session cookie', async () => {
      const response = await httpRequest()
        .post('/api/auth/register')
        .set('Origin', ALLOWED_ORIGIN)
        .send({
          name: 'Integration Learner',
          email: LEARNER_EMAIL,
          password: LEARNER_PASSWORD,
        })
        .expect(201);

      expect(response.body.data.user.email).toBe(LEARNER_EMAIL);
      const setCookie = response.headers['set-cookie'] as unknown as string[];
      expect(setCookie).toBeDefined();
      const raw = setCookie.find((value) =>
        value.startsWith(`${SESSION_COOKIE_NAME}=`),
      );
      expect(raw).toBeDefined();
      expect(raw).toContain('HttpOnly');
      sessionCookie = raw!.split(';')[0];
    });

    it('never returns the stored password hash to the client', async () => {
      const response = await httpRequest()
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.data.user.email).toBe(LEARNER_EMAIL);
      expect(JSON.stringify(response.body)).not.toContain(LEARNER_PASSWORD);
      expect(response.body.data.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('adaptive learning persistence', () => {
    let sessionId: string;
    let currentItemId: string;

    it('creates a Level 1 session backed by the seeded question bank', async () => {
      const response = await httpRequest()
        .post('/api/learning/sessions')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Cookie', sessionCookie)
        .send({
          subject: TEST_SUBJECT,
          chapter: TEST_CHAPTER,
          topic: TEST_TOPIC,
        })
        .expect(201);

      const { session, currentItem, state } = response.body.data;
      expect(session.level).toBe(1);
      expect(session.totalQuestions).toBeGreaterThan(0);
      expect(state.currentLevel).toBe(1);
      expect(currentItem).not.toBeNull();
      sessionId = session.id;
      currentItemId = currentItem.id;
    }, 30_000);

    it('does not leak the stored solution through the session payload', async () => {
      const response = await httpRequest()
        .get(`/api/learning/sessions/${sessionId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toContain('INTEGRATION_SOLUTION_SENTINEL');
      expect(response.body.data.currentItem).not.toHaveProperty(
        'correctAnswer',
      );
    });

    it('writes an answer row and advances learner state in the database', async () => {
      await httpRequest()
        .post(
          `/api/learning/sessions/${sessionId}/items/${currentItemId}/answer`,
        )
        .set('Origin', ALLOWED_ORIGIN)
        .set('Cookie', sessionCookie)
        .send({ selectedOption: CORRECT_OPTION, elapsedSeconds: 12 })
        .expect(201);

      const answers = await dataSource.query<
        Array<{ is_correct: boolean; selected_option: string }>
      >(
        'SELECT is_correct, selected_option FROM learning_answers WHERE session_item_id = $1',
        [currentItemId],
      );
      expect(answers).toHaveLength(1);
      expect(answers[0].is_correct).toBe(true);
      expect(answers[0].selected_option).toBe(CORRECT_OPTION);

      const states = await dataSource.query<
        Array<{ total_answered: number; total_correct: number }>
      >(
        'SELECT total_answered, total_correct FROM learning_topic_states WHERE topic = $1',
        [TEST_TOPIC],
      );
      expect(states).toHaveLength(1);
      expect(Number(states[0].total_answered)).toBe(1);
      expect(Number(states[0].total_correct)).toBe(1);
    }, 30_000);

    it('projects the active topic into the learner dashboard', async () => {
      const response = await httpRequest()
        .get('/api/learning/dashboard')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(JSON.stringify(response.body)).toContain(TEST_TOPIC);
    }, 30_000);
  });

  describe('session teardown', () => {
    it('invalidates the session cookie on logout', async () => {
      await httpRequest()
        .post('/api/auth/logout')
        .set('Origin', ALLOWED_ORIGIN)
        .set('Cookie', sessionCookie)
        .expect(201);

      await httpRequest()
        .get('/api/auth/me')
        .set('Cookie', sessionCookie)
        .expect(401);
    });
  });
});
