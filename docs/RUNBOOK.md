# Production runbook

Operational reference for running the JEE adaptive learning platform in
production. Product behaviour lives in `WORKING_DOCUMENT.md`; this file covers
only deploying, observing, and recovering the system.

_Last work log: 2026-08-26 — see commit history for details._

## Topology

| Piece | Runs on | Entry point |
| --- | --- | --- |
| Frontend (Next.js) | Vercel | `learning-platform-frontend` |
| Backend (NestJS) | Vercel serverless function | `learning-platform-backend/api/index.ts` |
| Database | Managed PostgreSQL | `DATABASE_URL` |
| Vector search (optional) | Qdrant | `QDRANT_URL` |
| LLM (optional) | DeepSeek | `DEEPSEEK_API_KEY` |

Qdrant and DeepSeek are optional by design. When either is unset or failing the
backend falls back to database-only behaviour rather than erroring, so an LLM
outage degrades the tutor and generation features without taking the platform
down.

## Required configuration

The backend validates its configuration at boot (`src/config/env.validation.ts`)
and **refuses to start** if any of the following is wrong. A bad deploy fails
immediately instead of serving broken requests.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | always | Must be a `postgres://` or `postgresql://` URL |
| `FRONTEND_ORIGIN` | production | Comma-separated; every entry must be `https://` |
| `DATABASE_SSL` | production | Must not be `false` |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | production | Must not be `false` |
| `SENTRY_DSN` | optional | Error tracking is inert when unset |
| `SENTRY_TRACES_SAMPLE_RATE` | optional | Number between 0 and 1, default `0.1` |

If the function fails to boot, the deployment log shows
`Invalid environment configuration:` followed by every problem at once.

## Deploying

1. Merge to `main`. CI (`.github/workflows/ci.yml`) must be green: backend and
   frontend lint/test/build, plus migrations, schema-drift, and integration
   tests against a real PostgreSQL service container.
2. If the change touches `src/migrations/**`, the migrate workflow runs first
   and applies pending migrations to production. It skips itself with a log
   line when `PRODUCTION_DATABASE_URL` is not configured.
3. Vercel builds and promotes both projects.
4. Verify: `curl -fsS https://<backend-host>/health` returns
   `{"status":"ok","database":"ok",...}`.

### Schema changes

Migrations run while the previous release is still serving traffic, so every
migration must be backwards compatible with the code already deployed —
expand now, contract in a later release:

- **Adding** a column: make it nullable or give it a default. Safe immediately.
- **Renaming** a column: add the new one, backfill, deploy code that writes
  both, then drop the old one in a *separate later* release.
- **Dropping** a column or table: only after no deployed code references it.
- Never edit a migration that has already run in production. Add a new one.

Verify locally before pushing:

```bash
cd learning-platform-backend
npm run migration:run
npm run check:schema-drift   # entities and migrations must agree
```

## Observing

- **Health**: `GET /health` returns 200 with a live database, 503 otherwise.
  Point an uptime monitor at it with a 1-minute interval; alert on two
  consecutive failures. It performs `SELECT 1`, so it detects a database that
  is unreachable, out of connections, or failing over.
- **Request logs**: every request emits one structured JSON line with
  `requestId`, `method`, `path`, `statusCode`, `durationMs`
  (`RequestContextMiddleware`).
- **Correlation**: every response carries an `X-Request-Id` header, and every
  error response body repeats it as `requestId`. A learner reporting a failure
  only needs to supply that id.
- **Errors**: 5xx responses are captured to Sentry when `SENTRY_DSN` is set,
  tagged with the same `requestId`. Client 4xx responses are deliberately not
  reported — they are normal traffic and would bury real faults. Request
  bodies, cookies, and headers are stripped before sending, because learner
  answers and tutor prompts are personal data.

### Triage

1. Get the `requestId` from the user, the response body, or Sentry.
2. Find the matching request log line for the route, status, and duration.
3. Reproduce against a scratch database — never against production.

## Recovering

### Bad application release

Roll back in Vercel: promote the previous deployment. Both projects deploy
independently, so roll back whichever one regressed. Because migrations are
expand-only, the previous release still runs against the migrated schema.

### Bad migration

Migrations are not auto-reverted; rolling back the code does not undo them.

```bash
cd learning-platform-backend
DATABASE_URL=<production> npm run migration:revert   # reverts the last one only
```

Confirm the migration's `down()` is actually safe before running it — a `down`
that drops a column destroys data written since the deploy. When it is not
safe, write a forward-fixing migration instead.

### Database unreachable

`/health` returns 503 and every authenticated route fails. Check the provider's
status and connection limits first — the serverless function opens a connection
per cold start, so a spike in concurrency can exhaust a small connection pool
before anything is actually wrong with the database.

### LLM or vector search degraded

No action required to stay up. Tutor replies, flashcard generation, and
question augmentation fall back to database-backed behaviour. Confirm by
checking that `/health` is still 200 and that non-AI routes respond.

## Data safety

- Seed scripts that delete rows require `ALLOW_DESTRUCTIVE_SEED` to be set.
  Never set it against production.
- The integration suite writes and deletes rows and refuses to run without an
  explicit `DATABASE_URL`. Point it only at a disposable database.
- Session cookies are `HttpOnly`, and `Secure` + `SameSite=None` in production.
  Unsafe requests additionally require an allowed `Origin` (`CsrfOriginGuard`).

## Question supply

Adaptive practice needs `LEARNING_QUESTIONS_PER_SESSION` (5) questions at a
single coordinate, and a topic has 12 coordinates, so a fully covered topic
needs **60** questions. Below that, a learner hits the fallback chain in
`AdaptiveService.createOrResume`:

1. The exact coordinate.
2. The nearest ready coordinate — the learner's level is moved to match.
3. A calibration set, which widens from the topic to the whole **chapter**.
4. On-demand AI generation, when `DEEPSEEK_API_KEY` is set.
5. Otherwise `503` with "This topic needs one ready five-question set…".

Audit supply across the whole catalogue before opening a subject to learners.
The script is read-only and safe to point at production:

```bash
DATABASE_URL=<production> npm run audit:coverage
DATABASE_URL=<production> npm run audit:coverage -- --subject Physics
DATABASE_URL=<production> npm run audit:coverage -- --json
```

It exits non-zero while any topic is short, so it can gate a launch. The
per-coordinate columns show where the gaps are, and the summary calls out
topics that cannot even fill a Level 1 session — those are unusable on day one,
because every learner starts at Level 1.
