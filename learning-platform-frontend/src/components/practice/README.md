# Practice session components

`PracticeSession` runs a learner practice attempt against the authenticated API.
It receives no answer key or explanation. The server owns selection validation,
scoring, the final result, and review data. `PracticeReview` is intentionally
separate so explanations are requested only after a submitted attempt.
