# Learning workspace UI

These components power the student-facing learning workspace and never ship mock question, progress, tutor, or flashcard data in the browser.

- `AdaptiveStudySession` is the topic workspace. It exposes three learner-facing tabs: dashboard, quizzes and flashcards, and the practice studio.
- The practice studio no longer lets the learner choose a raw entry level. It starts an API-owned session and displays the system-calculated placement in learner-friendly language.
- `StudyAssistant` supports both the compact floating helper pattern and the inline side-panel pattern used inside the practice studio. Tutor responses are rendered through the safe Markdown parser in `src/lib/tutor-markdown.ts`, so headings, lists, inline code, and emphasis stay readable without browser-side HTML injection.
- `FlashcardDeck` remains database-backed and records every review action through the API.
- `LearningOverview` and `LearningHistoryPanel` summarize saved progress, mastered topics, and next-step suggestions from `/api/learning/dashboard`.

The shared `src/lib/learning-types.ts` mirrors the server payloads, while `src/lib/learning.ts` only serializes route scope and workspace tab selection. All learner-specific values are fetched from the database-backed API.
