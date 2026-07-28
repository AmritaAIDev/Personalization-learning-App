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
