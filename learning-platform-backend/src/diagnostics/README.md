# Diagnostics module

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
