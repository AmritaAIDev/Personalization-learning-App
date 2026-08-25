# Learning workspace UI

Powers the student-facing "Learn" workspace. Never ships mock question, progress, tutor, or flashcard data — everything comes from the API.

## Structure

`AdaptiveStudySession` is the workspace shell; it owns session/dashboard state and delegates to:

- `LearningTabs` — Overview / Practice / Flashcards, mirrored into the URL so a view is shareable.
- `TopicOverview` — mastery, accuracy, checkpoint, recent trail, concept breakdown.
- `PracticeWorkspace` — the adaptive round, with the tutor board beside it.
- `FlashcardDeck` — the recall run, opened as a full-surface dialog.
- `StudyAssistant` — the linked tutor board (inline panel or floating helper).
- `StudyMarkdown` — the single renderer for study prose (GFM + KaTeX, no raw HTML). `normalizeMathDelimiters` rewrites `\(...\)`/`\[...\]` to the `$...$` form `remark-math` expects, so model-emitted equations render even when the model ignores that instruction.
- `LearningOverview` / `LearningHistoryPanel` — saved progress and next-step suggestions.

Overview and Practice both stay mounted while hidden, so switching tabs never throws away an in-flight round.

## Practice behavior

- Two attempts per question. A first miss opens a Socratic hint with the answer withheld; the tried option shows struck-through so the retry is a real second choice.
- A correct answer holds on the current question (highlighted, options locked) with an explicit **Next question** button — it does not auto-advance, matching every other question flow in the app (Practice, Mock Tests, Diagnostics).
- Options answer with `1`–`4`; `H`/`E` trigger a hint/explain tutor prompt.
- A round auto-continues between rounds for advance/reinforce/rebuild transitions after a short beat; mastery, a prerequisite reroute, and a miss stop for an explicit choice instead.
- A "Review (N)" toggle lets the learner browse already-answered questions in the round without losing their place.

## Flashcards

Keeps a small buffer of cards ahead of the learner and tops it up in the background. Ratings post against the card's real identifier and drive the server-side FSRS schedule; "Again" requeues the card a few cards later. `Space` flips, `1`–`4` rate, `H` reveals the hint, `Esc` closes. Response time to reveal is tracked client-side and surfaced as a "worth a closer look" note at the end of a run when it's unusually slow — a signal only, never fed into the schedule itself.

Queue logic lives in `src/lib/flashcard-session.ts` as pure, unit-tested functions.

## Tutor board

Hints/explanations are written in the background; the board shows a "writing" state driven by the `pending` flag and polls with backoff (`src/lib/tutor-polling.ts`). The learner's own message echoes immediately. Quick prompts (**Hint / Explain / Why wrong?**) are visible buttons above the input.

## Shared pieces

- `ExplainThis` — one-tap explanation control (practice/diagnostic review) with a depth toggle (`Concise` / `Step by step` / `From scratch`); labels a degraded response as offline.
- `TargetedPracticeCard` — on-demand single-question control behind "Practice this misconception" and "Try a similar one."
- `SourceCitations` — renders the RAG citation strip; renders nothing when empty.
- `ConceptRevisionPanel` — optional pre-practice topic summary, opened from a "Revise" button; never blocks reaching Practice or Flashcards.

`src/lib/learning-types.ts` mirrors server payloads; `src/lib/learning.ts` handles route scope, tab selection, round-outcome copy, and the plain-language Bloom-level labels shown on screen.
