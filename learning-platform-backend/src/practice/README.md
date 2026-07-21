# Practice Module

This module runs a secure, database-backed practice session for one published
subject/chapter/topic scope.

- A session always contains 15 questions: five Easy, five Medium, and five Hard.
- The server owns the question set, saved answers, scoring, and review release.
- Correct answers and explanations are withheld until a submitted session is
  retrieved through the review endpoint.
- Only published bank content is eligible for student practice.

The catalog endpoint in QuestionsModule exposes the readiness counts that the
frontend uses before offering a practice session.
