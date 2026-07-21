# JEE AI Competency Engine frontend

The Next.js student application for the JEE competency platform. The current production flow implements a secure, reference-aligned Class XII Physics Electrostatics diagnostic.

## Student flow

1. Register or sign in through the backend session API.
2. Search a reviewed topic and choose a database-backed Bloom × difficulty entry coordinate in the 15-level adaptive journey.
3. Complete five-question rounds with server-owned grading, Socratic retry rules, a compact persisted helper, and spaced-recall flashcards.
4. Use the separate balanced 15-question practice set for post-learning review; answer keys remain server-side until submission.
5. Start or resume a 15-question baseline diagnostic, then view database-backed recommendations and history.

Admins also receive a separate content-review route. It can generate an AI draft,
inspect its answer key, and publish or archive it; students cannot access that
workflow.

Correct answers, solutions, session tokens, timing authority, scoring, generated pools, chat history, and flashcards are never held as frontend fixture data.

## Local development

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Run `npm test` for API-client coverage and `npm run build` for a production build.

The NestJS API must be running, and its `FRONTEND_ORIGIN` must include the frontend origin (normally `http://localhost:3000`).
