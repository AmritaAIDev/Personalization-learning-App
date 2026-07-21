# JEE AI Competency Engine backend

NestJS and TypeORM backend for a secure Class XII Physics Electrostatics diagnostic and the broader adaptive-learning platform.

## Secure diagnostic flow

- `AuthModule` issues opaque, random HttpOnly session cookies and persists only SHA-256 token hashes. Passwords are bcrypt-hashed.
- `DiagnosticsModule` owns attempts, 30-minute timing, saved selections, grading, topic/Bloom analysis, recommendations, and history.
- `PracticeModule` creates one server-owned, balanced 15-question session per learner and topic: five Easy, five Medium, and five Hard questions with Bloom/concept diversity.
- `AdaptiveModule` owns the formative 15-coordinate Bloom × difficulty journey, five-question cache, database job queue for DeepSeek replenishment, flashcard SRS, and persisted Socratic tutor threads.
- AI-generated questions are saved as `DRAFT` records. Only an admin reviewer can inspect answer keys and explicitly publish or archive content.
- Learner-private generated questions are validated and stored in a separate adaptive pool; they never bypass the global question-bank review workflow.
- Correct answers and solutions stay in PostgreSQL. They are never returned by a student diagnostic endpoint before submission.
- Validation, restrictive credentialed CORS, Helmet headers, origin checks for unsafe cookie requests, rate limiting, and role guards are configured globally.

## Setup

1. Copy `.env.example` to `.env` and set your private `DATABASE_URL`.
2. Install dependencies with `npm install`.
3. Run the migrations:
   ```bash
   npm run migration:run
   ```
4. Load the safe, idempotent diagnostic bank and resources:
   ```bash
   npm run seed:diagnostic
   ```
5. Load the adaptive baseline questions and flashcards:
   ```bash
   npm run seed:adaptive
   ```
6. Start the API with `npm run start:dev`.

Use `npm test` for unit tests and `npm run build` for a production compilation check.

## Migration and seed policy

`synchronize` is disabled. Every structural change must be represented by a TypeORM migration. `seed:diagnostic` and `seed:adaptive` only upsert reviewed content; neither deletes learner data. The older journey seed is explicitly guarded behind `ALLOW_DESTRUCTIVE_SEED=true` and must not be used against production data.

For deployment, terminate TLS at the application or trusted proxy and run with
`NODE_ENV=production`; session cookies then use the `Secure` attribute. Local
HTTP development deliberately runs without that attribute so `localhost` can
exercise the same session flow.
