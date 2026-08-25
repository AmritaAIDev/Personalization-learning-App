# Agent module

The single LLM boundary for the platform. All DeepSeek and Qdrant calls are isolated in `AgentService`; every other module goes through it instead of talking to the model or vector store directly. Defensive by default: a missing API key, timeout, rate limit, or unparseable output degrades to a database-backed fallback instead of throwing to the learner.

## Key methods

- `generateLearningQuestionBatch` — private per-learner question pool, grounded in reviewed material.
- `generateFlashcards` — flashcards from published question material.
- `generateTutorResponse(context)` — Socratic hint/explanation. Withholds the answer until `answerRevealed`; `context.depth` (`concise` | `step-by-step` | `from-scratch`) shapes a *revealed* explanation only.
- `retrieveSupplementalSources(topicName)` — cached, timeout-bounded RAG citation lookup; empty/slow Qdrant just means `sources: []`, never a blocked answer.

## Callers

`AdaptiveModule` (questions, flashcards, tutor), `DoubtsModule` (background doubt resolution), `NotebookConceptService` (recurring-gap summaries), `QuestionsModule` (admin generation + reviewer chat).

## Safety

Only reviewed PostgreSQL material grounds student-facing generation. Learner-private generated questions never enter the public `questions` bank — publication is an explicit admin action.

No HTTP surface — internal only.
