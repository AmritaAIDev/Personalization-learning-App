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
    - **Explanation depth** — `context.depth` (`concise` | `step-by-step` | `from-scratch`, from `EXPLANATION_DEPTHS`) adds a single wording directive to the prompt. It only shapes a *revealed* explanation; a withheld hint keeps its tight single-hint format regardless of depth, so depth can never be used to coax the answer out early. Defaults to the base prompt's own length guidance when unset.
  - `chatWithTutor` — admin reviewer chat.
  - `retrieveSourcesFromQdrant(topicName)` — structured counterpart of `retrieveContextFromQdrant`: returns the top reviewed concept notes as `RetrievedSource[]` (`title`, `topic`, `chapter`, `snippet`) so callers can both ground on the snippet and cite the title.
  - `retrieveSupplementalSources(topicName)` — best-effort, cached, timeout-bounded (`SUPPLEMENTAL_CONTEXT_TIMEOUT_MS`) wrapper used for RAG citations. On a slow/unreachable store it costs one timeout per topic and then serves `[]`, so an answer is never blocked or delayed waiting on grounding. `generateConceptExplanation` grounds on exactly these sources, so a returned citation always matches what shaped the answer.
- `EmbeddingService` / `embedding.util` — Qdrant embedding helpers used for supplemental grounding.

## RAG citation contract

`retrieveSupplementalSources` returns the reviewed notes an answer is grounded
on. Callers reduce them to a learner-facing `Citation[]` via `toCitations`
(`src/citation.util.ts`), which **de-duplicates by title, caps at three, and
strips the raw `snippet`** — only the label (`title`/`topic`/`chapter`) leaves
the server. The on-demand explanation endpoints return
`{ explanation, grounded, sources }`, and the doubts path persists the same
`sources` on the answered doubt. Retrieval is never on the critical path:
Qdrant empty or down simply means `sources: []`.

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