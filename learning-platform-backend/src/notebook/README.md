# Notebook Module

The Notebook module is the repair layer for the student. It does not use
frontend mock data. The first production-safe version derives mistake cards
from answers already saved in the database:

- submitted practice answers where `isCorrect = false`
- adaptive learning answers where `isCorrect = false`

## Endpoint

`GET /api/notebook/mistakes`

Returns the latest mistake cards for the signed-in student. Each card includes
the question, selected answer, correct answer, worked solution, misconception
hint, concept tags, level metadata, and a `practiceSimilar` scope that the
frontend can use to send the student back into targeted practice.

## Data strategy

This module intentionally avoids a new notebook table for the first slice. The
notebook is a read model over saved learning evidence. A future dedicated
review-scheduling table can be added when due-review intervals and student
card actions need their own lifecycle.

## Concept-level view

`GET /api/notebook/concepts`

The per-question list gets noisy fast, so the notebook also exposes a
concept-level view. `NotebookService.getConceptGroups` clubs every wrong answer
by `(subject, topic)` and computes counts, due counts, bloom/difficulty
spreads, and the member cards for drill-down.

### LLM synthesis

`NotebookConceptService` (the isolated LLM boundary, AGENTS.md §4) asks the model
to name the single recurring conceptual gap for each group with at least two
mistakes. Singletons use a deterministic label/summary and never call the model.
The model is never a hard dependency: a missing `DEEPSEEK_API_KEY`, a timeout,
rate limit, or unparseable output all fall back to deterministic text.

### Caching

Synthesised summaries are cached in the `notebook_concept_summaries` table
(migration `1785300000000-CreateNotebookConceptSummaries`). A row is keyed per
`(user, subject, topic)` and carries a `source_hash` of the constituent
misconceptions; the summary is regenerated only when the learner makes a *new*
mistake in that topic (different hash). This keeps the model out of the hot path
on every page load.

### Components

- `notebook.controller.ts` — `mistakes` and `concepts` endpoints.
- `notebook.service.ts` — card building, topic grouping, cache orchestration.
- `notebook-concept.service.ts` — the only place that calls the LLM.
- `notebook-concept-summary.entity.ts` — durable summary cache.

### Dominant misconception and targeted remediation

Each concept group also carries `dominantMisconception` (`{ text, count } | null`):
the most-repeated *classified* misconception for that `(user, topic)`, sourced
from the `misconceptions` module rather than just the first `common_errors`
entry on any one card — see `../misconceptions/README.md`. It is `null` until
at least one wrong answer in that topic has been classified.

When present, the frontend offers "Practice this misconception," which
generates one on-demand question focused on that exact gap via the shared
`targeted-practice` module (`../targeted-practice/README.md`) — the same
generation primitive used for the "try a similar one" action elsewhere.