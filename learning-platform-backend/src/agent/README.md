# Agent module

The single LLM boundary for the platform (AGENTS.md §4). All DeepSeek and Qdrant
interaction is isolated here; every other module calls `AgentService` and never
talks to the model or vector store directly. The service is defensive: a missing
`DEEPSEEK_API_KEY`, a timeout, a rate limit, or unparseable output degrades to a
database-backed fallback instead of throwing to the learner.

## Key components

- `AgentService` — DeepSeek (OpenAI-compatible client) for JSON and text generation, plus Qdrant retrieval for grounded context.
  - `generateLearningQuestionBatch` — builds a private pool of adaptive questions for a learner/coordinate, grounded in reviewed PostgreSQL material + optional Qdrant context.
  - `generateFlashcards` — generates flashcards from published question material.
  - `generateTutorResponse(context)` — Socratic hint/explanation for an in-session tutor thread. When `answerRevealed` is false the correct answer and solution are never included in the prompt; a server-side boundary also replaces any model reply that repeats the exact stored answer with a safe hint.
  - `chatWithTutor` — admin reviewer chat.
- `EmbeddingService` / `embedding.util` — Qdrant embedding helpers used for supplemental grounding.

## Callers

- `AdaptiveModule` — question generation, flashcard generation, tutor responses (background, with a `pending` flag).
- `DoubtsModule` — doubt resolution, run out-of-band (`resolveDoubtInBackground`).
- `NotebookConceptService` — concept-level recurring-gap summaries (its own isolated client, but the same model/prompt discipline).
- `QuestionsModule` — admin candidate generation + reviewer chat.

## Safety

Only reviewed PostgreSQL material is used as grounding for student-facing
generation. Learner-private generated questions are never inserted into the
public `questions` bank; publication is an explicit admin action. The unrevealed
answer boundary is enforced both in the prompt and on the response.

No HTTP surface — this module is internal only.