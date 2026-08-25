# Integration test harness

These specs are the only tests that run against a **real PostgreSQL database**.
Every other backend suite mocks its repositories, which means they can all pass
while the migrations, entities, and guards disagree with one another. This
harness is what catches that.

## What it proves

| Area | Assertion |
| --- | --- |
| Deployment | `/health` reports a reachable database |
| Migrations | Every migration is applied and none are left pending |
| Auth boundary | Unauthenticated reads are rejected with 401 |
| CSRF | An unsafe request from a foreign browser origin is rejected with 403 |
| Sessions | Register issues an `HttpOnly` cookie; logout invalidates it |
| Data exposure | No password hash and no stored solution text reaches the client |
| Adaptive persistence | An answer writes a `learning_answers` row and advances `learning_topic_states` |
| Projection | An active topic appears in the learner dashboard |

## Running locally

The suite writes and deletes rows, so point it at a **disposable** database
only. It refuses to start without `DATABASE_URL` and never falls back to a
default connection string.

```bash
createdb jee_test
export DATABASE_URL="postgres://postgres@127.0.0.1:5432/jee_test"
export DATABASE_SSL=false

npm run migration:run       # build the schema from nothing
npm run check:schema-drift  # entities and migrations must agree
npm run test:integration
```

## Test data

All rows created here are namespaced (`Integration Test Topic`, question ids
prefixed `ITEST-`) and removed in `afterAll`, so a failed run leaves nothing
behind that a later run would trip over.

## Schema drift check

`npm run check:schema-drift` compares the entity metadata against the migrated
schema. TypeORM's own `schema:log` cannot be gated on directly: it always
proposes recreating foreign keys, check constraints, and indexes whose names it
did not generate, and every hand-written migration in this repo names its own.
The check therefore fails only on **structural** differences — a table or column
present in one place and absent in the other — which is the drift that actually
breaks a deploy.
