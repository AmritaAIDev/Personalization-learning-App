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

## Rendering & design

- StudyMarkdown is the single renderer for all study prose (tutor replies, questions, options, solutions, flashcards). It runs remark-gfm + remark-math + rehype-katex and a normalizeMathDelimiters pre-pass that converts \\(...\\) / \\[...\\] to $...$ / $$... and repairs \\text(...), so model-emitted LaTeX renders even when the model ignores the dollar-delimiter instruction. KaTeX CSS is loaded once in the root layout.
- Type: Poppins carries body copy and descriptions (warmer read); Urbanist remains the heading voice. The root font-size is 15px so rem-based content sits in proportion with the px-sized sidebar.
- The test-taking surface (/diagnostic/[id]) is a focused assessment: compact header with a live countdown, keyboard answering (1-N, arrows), autosave, and a submit-confirmation modal. The notebook (/notebook) is a concept-level list (mistakes clubbed by topic with an AI recurring-gap summary and an expandable per-question drill-down). Doubts (/doubts) poll for the background tutor response instead of blocking on the model.

## Data fetching

apiFetch (src/lib/api.ts) is the only HTTP client. It unwraps the { data } envelope, normalises the API URL from NEXT_PUBLIC_API_URL, deduplicates in-flight GETs, and supports an optional in-memory read cache (memoryCacheTtlMs) for slowly-changing data. Learning-data writes broadcast a jee-ai:learning-data-updated event so dependent views can refresh. No static mock data is shipped in components.

## Local development

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL`.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Run `npm test` for API-client coverage and `npm run build` for a production build.

The NestJS API must be running, and its `FRONTEND_ORIGIN` must include the frontend origin (normally `http://localhost:3000`).
