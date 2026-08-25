# Notebook module

The repair layer for the student — a read model over saved learning evidence, not a new source of truth. Mistake cards are derived from submitted practice/adaptive answers where `isCorrect = false`; there is no separate notebook table.

The concept-level view (`getConceptGroups`) clubs wrong answers by `(subject, topic)`, computing counts, due counts, and Bloom/difficulty spreads. `NotebookConceptService` asks the model to name the recurring conceptual gap for groups with ≥2 mistakes (cached in `notebook_concept_summaries`, keyed by a hash of the constituent misconceptions so it only regenerates on a genuinely new mistake); singletons use a deterministic label and never call the model.

Each concept group also carries `dominantMisconception` from the `misconceptions` module (see its README) — the most-repeated *classified* gap, not just the first `common_errors` string on any one card.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notebook/mistakes` | latest mistake cards for the signed-in student |
| GET | `/api/notebook/concepts` | concept-level grouping with drill-down cards |
| POST | `/api/notebook/mistakes/:source/:questionId/review` | record a recall rating for a mistake card |
