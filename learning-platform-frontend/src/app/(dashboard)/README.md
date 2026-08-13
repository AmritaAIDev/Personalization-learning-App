# Authenticated student workspace

`(dashboard)` is protected by `DashboardAccess`, while the NestJS API remains the source of authorization.

## Core routes

- `/`: live diagnostic status, adaptive topic suggestions, active routes, and completed-topic highlights.
- `/learn`: five-question Bloom × difficulty adaptive journey with a contextual tutor and database flashcards.
- `/diagnostic`: server-backed start or resume entry point.
- `/diagnostic/[attemptId]`: timed, auto-saving question flow with no answer-key payload.
- `/analysis/[attemptId]`: submitted topic and Bloom analysis.
- `/recommendations/[attemptId]`: resources selected from the database using weak topics.
- `/practice`: reviewed practice entry point and practice-mode selector. Topic-scoped practice still uses backend-created attempts.
- `/tests`: baseline, reviewed-practice, and future mock-test command surface.
- `/notebook`: mistake and revision notebook surface for wrong-answer repair.
- `/doubts`: context-aware doubt entry surface that should remain linked to topic/question state. The composer's camera button (AI Phase 2.6) runs client-side OCR (`@/lib/ocr`, dynamically-imported `tesseract.js`) on a photo/upload and drops the extracted text into the message box for the learner to edit before sending — no new backend endpoint or vision API; it feeds the existing doubt/tutor pipeline. OCR failure or an empty result surfaces an inline error and leaves the composer for manual typing (the roadmap's required fallback), never a dead end.
- `/profile`: authenticated profile, completed diagnostic attempts, and saved adaptive-topic history.

`/arena` is retained only as a legacy compatibility route for older practice links. New product links should point to `/practice`.
