# JEE Competency Diagnosis & Adaptive Learning Platform

An AI-powered adaptive learning platform for JEE (currently Class XII Physics —
Electrostatics). It diagnoses competency, serves formative practice, repairs
mistakes, and answers doubts — all grounded in a reviewed PostgreSQL question
bank, with DeepSeek + Qdrant isolated behind dedicated services.

## Monorepo layout

- `learning-platform-backend/` — NestJS + TypeORM API (PostgreSQL). See
  [`learning-platform-backend/README.md`](learning-platform-backend/README.md)
  for the full architecture and **API endpoint reference**.
- `learning-platform-frontend/` — Next.js student app. See
  [`learning-platform-frontend/README.md`](learning-platform-frontend/README.md)
  for components, rendering, and data fetching.
- `students-sample/` — sample student reference material.

## Student surfaces

- **Learn** (`/learn`) — the adaptive workspace: a 12-coordinate Bloom ×
  difficulty journey, five-question rounds with Socratic retry, a linked AI
  tutor, and spaced-recall flashcards. Rounds auto-advance on ≥80% first-try
  accuracy.
- **Tests** (`/tests`) — a secure, timed 15-question diagnostic. Mark-weighted
  scoring, weak-topic detection with a sample-size guard, per-question review
  with worked solutions, and curated recommendations.
- **Practice** (`/practice`) — a reviewed 15-question (5E/5M/5H) exam-style
  attempt; answer keys are server-side until submission.
- **Notebook** (`/notebook`) — mistakes clubbed by concept with an
  LLM-synthesised recurring-gap summary (cached per topic) and an expandable
  per-question drill-down.
- **Doubts** (`/doubts`) — student-authored doubts resolved by the AI tutor
  out-of-band (the form never blocks on the model).

Admins get a separate content-review route (generate AI drafts, inspect keys,
publish/archive).

## Tech stack

- Backend: NestJS, TypeORM, PostgreSQL, DeepSeek (OpenAI-compatible), Qdrant,
  bcrypt session cookies, `@nestjs/throttler`, class-validator.
- Frontend: Next.js (app router), React 19, Tailwind v4, KaTeX via
  `react-markdown` + `remark-math` + `rehype-katex`, framer-motion,
  `@xyflow/react`.

## Prerequisites

- Node, PostgreSQL, and (optional for AI features) a DeepSeek API key and a
  Qdrant instance. Without AI keys the app still runs on database-backed fallbacks.

## Getting started

The easiest way to run both apps together is the helper script from the repo
root:

```powershell
.\start-dev.ps1
```

This starts the backend on `http://localhost:4000` and the frontend on
`http://localhost:3000` (override with `-FrontendPort` / `-BackendPort`).

### Manual

Backend:

```bash
cd learning-platform-backend
cp .env.example .env            # set DATABASE_URL, DEEPSEEK_API_KEY, QDRANT_*
npm install
npm run migration:run
npm run seed:diagnostic
npm run seed:adaptive
npm run start:dev               # http://localhost:4000
```

Frontend:

```bash
cd learning-platform-frontend
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                     # http://localhost:3000
```

The backend `FRONTEND_ORIGIN` must include the frontend origin.

## Conventions (see `AGENTS.md`)

Modular NestJS modules; strict TypeScript (no `any`); `synchronize: false` with
TypeORM migrations; secrets only via env + `ConfigService`; LLM/vector DB isolated
in `AgentService`; tests and module-level READMEs alongside every feature;
responsive, professional UI with no hardcoded mock data in components.

## Tests

- Backend: `npm test` (Jest).
- Frontend: `npm test` (Vitest).

## Production

Terminate TLS at the app or a trusted proxy and run with `NODE_ENV=production`
(session cookies then use `Secure`). Never run destructive seeds against
production data (`ALLOW_DESTRUCTIVE_SEED=true` gates them).