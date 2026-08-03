# Diagnostics module

## Topic placement

Topic placement is initiated only when a learner first opens a new topic. A `TOPIC_PLACEMENT` attempt stores the exact subject, chapter, and topic. On submission, its score places that untouched topic at Level 1, 3, 5, 7, or 9. Skipping placement creates the same topic through adaptive learning at Level 1. A placement result never overwrites answer-backed topic progress.

The diagnostics module implements the secure JEE AI baseline-assessment flow.

## Student flow

1. An authenticated student starts or resumes a server-owned 30-minute, 15-question diagnostic.
2. The API sends sanitized questions only; correct answers and solutions stay in PostgreSQL.
3. Answers are saved against the authenticated attempt, never against a client-supplied user ID.
4. Submission is scored on the server and persists topic/Bloom performance plus weak topics.
5. Recommendations are read from curated database resources for the calculated weak topics.

## Data integrity

`diagnostic_attempts` freezes the selected question IDs. `diagnostic_answers` is unique per
attempt/question and cascades when the owning attempt is deleted. Attempt expiry is enforced
by the backend timestamp, so changing a browser timer cannot extend the test.
# Diagnostics module

Tests are secure, database-backed diagnostics. A new attempt selects fifteen
published questions: five Easy, five Medium, and five Hard, with varied Bloom
levels and chapter coverage. The selector first avoids questions seen in the
learner's four most recent completed tests; it only falls back to the reviewed
bank if doing so is required to keep the test balanced.

AI-generated questions never enter a live test directly. They must be validated
and published to the `questions` bank first. Answers autosave server-side, the
server performs scoring on submission, and the resulting analysis powers test
history, weak-topic repair, and the Notebook.
