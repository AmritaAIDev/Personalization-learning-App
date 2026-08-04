# Learning workspace UI

These components power the student-facing learning workspace and never ship mock question, progress, tutor, or flashcard data in the browser.

## Structure

`AdaptiveStudySession` is the workspace shell. It owns session and dashboard state and delegates each surface to a focused component:

- `LearningTabs` — the three-way navigation (overview, practice, flashcards). The active tab is mirrored into the URL, so a workspace view is shareable and survives a reload.
- `TopicOverview` — mastery, accuracy, current checkpoint, recent trail, and the concept breakdown for the topic.
- `PracticeWorkspace` — the adaptive round: question card, optimistic answer selection, round progress, and the completion summary, with the tutor board beside it.
- `FlashcardDeck` — the recall run, opened as a full-surface dialog over the workspace.
- `StudyAssistant` — the linked tutor board, used inline as a panel or as a floating helper.
- `StudyMarkdown` — the single renderer for study prose (flashcards, tutor replies, question explanations), with GFM and KaTeX support and no raw HTML. `normalizeMathDelimiters` rewrites raw LaTeX delimiters `\(...\)` and `\[...\]` to the dollar form `remark-math` understands, and repairs the common `\text(enc)` mistake, so model-emitted equations render even when the model ignores the dollar-delimiter instruction. Question stems and answer options render through `StudyMarkdown`, so JEE equations display.
ormalizeMathDelimiters rewrites raw LaTeX \\(...\\) / \\[...\\] delimiters to the dollar form emark-math understands and repairs the common \\text(enc) mistake, so model-emitted equations render even when the model ignores the $...$ instruction. Question stems and answer options render through StudyMarkdown, so JEE equations display.
- `LearningOverview` and `LearningHistoryPanel` summarize saved progress, mastered topics, and next-step suggestions from `/api/learning/dashboard`.

Overview and practice both stay mounted while hidden, so switching tabs is instant and an in-flight round is never thrown away by navigation.

## Practice behaviour

- The learner never picks a raw entry level. The session is API-owned and the calculated placement is shown in learner-friendly language.
- Two attempts per question. A first miss triggers a Socratic hint and the answer stays hidden; the option already tried is struck through so the retry is a real second choice.
- Selecting an option updates immediately and shows an inline pending state; answers are graded server-side only. A ruled-out (wrong) option is shown in red with an X marker.
- Options can be answered with the `1`–`4` keys.
- Rounds auto-advance: when a round completes, an inline RoundOutcome banner shows the transition (advance, reinforce, rebuild, prerequisite route, or mastery) and starts the next round after a short beat - no required click. Only terminal states (mastery, prerequisite route) stop for an explicit choice. A persistent "Stop" control is always available. A failed "continue" surfaces inline rather than silently doing nothing.

## Flashcards

- The deck keeps a small buffer of cards ahead of the learner and tops it up in the background, so a rating always advances instantly.
- Ratings are posted against the card's real identifier and drive the server-side spaced-repetition schedule. "Again" also keeps the card in the current run and brings it back a few cards later.
- `Space` flips, `1`–`4` rate, `H` reveals the hint without flipping, `Esc` closes.
- Running out of cards ends in a calm run summary with the recall tally, not an error.

The queue rules live in `src/lib/flashcard-session.ts` as pure functions and are unit tested.

## Tutor board

Hints and explanations are written in the background after an answer. The board shows a live "writing" state driven by the `pending` flag from the conversation endpoint and polls with backoff (`src/lib/tutor-polling.ts`) until the reply lands. A learner's own message is echoed immediately rather than after the round trip, and the thread only auto-scrolls when the learner is already reading the newest message.

The shared `src/lib/learning-types.ts` mirrors the server payloads, while `src/lib/learning.ts` handles route scope, workspace tab selection, and the round-outcome copy. All learner-specific values are fetched from the database-backed API.
