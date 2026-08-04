# JEE AI Competency Engine — backend

NestJS + TypeORM backend for a secure Class XII Physics Electrostatics diagnostic and the broader adaptive-learning platform. PostgreSQL is the source of truth; DeepSeek (OpenAI-compatible) and Qdrant are isolated behind dedicated services and always degrade to database-backed fallbacks.

## Architecture

The app is composed of independent Nest modules, each owning its entities, services, and HTTP surface. `synchronize` is **disabled**; every schema change is a TypeORM migration.

| Module | Owns | HTTP prefix |
| --- | --- | --- |
| `auth` | cookie sessions, registration, login, `me` | `/api/auth` |
| `users` | learner profile (`me`) | `/api/users` |
| `topics` | subject/chapter/topic tree + prerequisite graph | `/api/topics` |
| `questions` | reviewed question bank, catalog counts, admin review + generation | `/api/questions` |
| `diagnostics` | timed tests, grading, analysis, review, recommendations | `/api/diagnostics` |
| `practice` | reviewed 15-question exam-style practice attempts | `/api/practice` |
| `adaptive` | formative Bloom×difficulty journey, tutor threads, flashcards, competency/growth | `/api/learning` |
| `agent` | the only LLM boundary (DeepSeek) + Qdrant embeddings | — (internal) |
| `notebook` | mistake cards + concept-level grouping with cached LLM summaries | `/api/notebook` |
| `doubts` | student-authored doubts with async tutor resolution | `/api/doubts` |
| `sessions` | journey timeline | `/api/sessions` |
| `dashboard` | student dashboard aggregate | `/api/dashboard` |
| `database` | DataSource, migrations, URL normalisation | — |

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `QDRANT_URL`, `QDRANT_API_KEY`.
2. `npm install`
3. `npm run migration:run` — apply schema migrations (never `synchronize`).
4. `npm run seed:diagnostic` — idempotent reviewed diagnostic bank + resources.
5. `npm run seed:adaptive` — adaptive baseline questions + flashcards.
6. `npm run start:dev` — API on `http://localhost:4000` (override with `PORT`).

Checks: `npm test` (unit), `npm run build` (production compile). Do **not** run `npm run build` while `start:dev` is live — both write to `dist/` and the watch server will crash.

## Security posture

- `AuthModule` issues opaque, random HttpOnly session cookies; only SHA-256 token hashes are persisted; passwords are bcrypt-hashed.
- Answers, correct options, and solutions live in PostgreSQL and are never sent to a student diagnostic/practice endpoint before submission.
- Restrictive credentialed CORS, Helmet, origin checks for unsafe cookie requests, `@nestjs/throttler` rate limits, and role guards are global.
- AI-generated questions land as `DRAFT`; only an admin can inspect keys and publish/archive. Learner-private generated questions never bypass the global review workflow.

## API reference

All routes are authenticated via the session cookie unless noted. Bodies are JSON; responses are wrapped in `{ data: ... }`.

### Auth — `/api/auth`
| Method | Path | Description |
| --- | --- | --- |
| POST | `/register` | create account, set session cookie |
| POST | `/login` | authenticate, set session cookie |
| POST | `/logout` | clear session |
| GET | `/me` | current authenticated user |

### Users — `/api/users`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/me` | profile (name, email, role, xp, level, streak) |

### Topics — `/api/topics`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/tree` | subject/chapter/topic tree |
| POST | `/` | (admin) create topic node |
| GET | `/:id/prerequisites` | prerequisite graph for a topic |

### Questions — `/api/questions`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/catalog` | reviewed question counts per scope (used by practice/diagnostic readiness) |
| GET | `/review` | (admin) queue of questions needing review |
| GET | `/bank` | (admin) bank listing |
| GET | `/bank/:questionId` | (admin) one question with key/solution |
| POST | `/generate` | (admin) generate candidate questions |
| POST | `/chat` | (admin) reviewer chat |
| PATCH | `/bank/:questionId/publication` | (admin) publish/archive |

### Diagnostics — `/api/diagnostics`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard` | stats, readiness, active attempt, recent history |
| GET | `/history` | submitted test history |
| DELETE | `/history` | clear history (body `{ confirmation: 'DELETE' }`) |
| POST | `/` | start/resume a 30-min, 15-question test (PROGRAM or TOPIC_PLACEMENT) |
| GET | `/:attemptId` | student-safe attempt (no keys/solutions) |
| PATCH | `/:attemptId/answers/:questionId` | autosave one selection |
| POST | `/:attemptId/submit` | grade server-side, persist analysis |
| GET | `/:attemptId/analysis` | score, grade, topic/Bloom performance, weak topics |
| GET | `/:attemptId/review` | per-question review (your answer vs correct, solution, isCorrect) |
| GET | `/:attemptId/recommendations` | curated resources for weak topics |

Scoring is **mark-weighted** (earned marks ÷ total marks). Weak topics require ≥2 questions in the topic (sample-size guard).

### Practice — `/api/practice`
| Method | Path | Description |
| --- | --- | --- |
| POST | `/sessions` | create/resume a 15-Q (5E/5M/5H) reviewed practice attempt |
| GET | `/sessions/:attemptId` | student-safe attempt |
| PUT | `/sessions/:attemptId/answers/:questionId` | autosave one answer (no grading) |
| POST | `/sessions/:attemptId/submit` | grade, mark attempt submitted |
| GET | `/sessions/:attemptId/review` | answers, correctness, solutions (after submit) |

### Adaptive learning — `/api/learning`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard` | active/completed/historic topics + suggestions |
| GET | `/growth` | weighted competency breakdown + growth timeline |
| GET | `/subtopics` | subtopic breakdown for a topic |
| GET | `/coverage` | ready-question coverage across the 12 coordinates |
| GET | `/placement` | placement gate for a topic |
| GET | `/flashcards` | spaced-repetition queue (new → due → scheduled) |
| POST | `/flashcards/generate` | next recall batch (pool first, generate shortfall) |
| POST | `/flashcards/:flashcardId/review` | record a recall rating |
| POST | `/sessions` | start/resume a 5-question coordinate round |
| GET | `/sessions/:sessionId` | current student-safe question + progress |
| POST | `/sessions/:sessionId/items/:sessionItemId/answer` | grade + route; round may auto-advance |
| GET | `/sessions/:sessionId/tutor` | persisted Socratic thread + `pending` flag |
| POST | `/sessions/:sessionId/tutor` | send a learner message to the tutor |

Round advance is accuracy-based: a round advances when ≥80% of its questions are resolved first-try (4 of 5). A first miss opens a Socratic hint without revealing the key; a second miss reveals the explanation and demotes/routes.

### Notebook — `/api/notebook`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/mistakes` | latest per-question mistake cards |
| GET | `/concepts` | mistakes clubbed by topic with an LLM-synthesised recurring-gap summary (cached, singletons use deterministic fallback) |

### Doubts — `/api/doubts`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | the student's doubt history (+ summary) |
| POST | `/` | save a doubt; returns immediately as `OPEN`, tutor response generated out-of-band (frontend polls until `ANSWERED`) |

### Sessions — `/api/sessions`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/journey` | learning journey timeline |

### Dashboard — `/api/dashboard`
| Method | Path | Description |
| --- | --- | --- |
| GET | `/student` | aggregate student dashboard |

## Migrations & seeds

`synchronize: false`. Migrations live in `src/migrations` and are glob-loaded. Run with `npm run migration:run` (`:show` / `:revert` for inspection/rollback). Seeds (`seed:diagnostic`, `seed:adaptive`, …) upsert reviewed content only and never delete learner data; destructive seeds are gated behind `ALLOW_DESTRUCTIVE_SEED=true`.

## Environment variables

Never hardcode secrets. Read via `ConfigService`: `DATABASE_URL`, `DATABASE_SSL`, `DATABASE_SSL_REJECT_UNAUTHORIZED`, `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `QDRANT_URL`, `QDRANT_API_KEY`, `PORT`, `NODE_ENV`, `ALLOW_DESTRUCTIVE_SEED`.