# Student dashboard module

`GET /api/dashboard/student` is the authenticated, read-only composition endpoint for the student home page.

It reuses the diagnostic, adaptive learning, competency, and notebook services rather than duplicating their database queries or storing a second dashboard projection. The response contains only progress, counts, scopes, and navigation metadata. It deliberately omits question text, answer keys, notebook solutions, and tutor messages.

The global session guard establishes the user identity; every underlying query is scoped to that user ID. The endpoint is throttled at 30 requests per minute and has no mutable inputs.

## Subject coverage

`subjectCoverage` groups the published question catalogue into topics, then joins it with the signed-in student's existing adaptive topic state. It reports mastered, active, paused, and not-started topic counts so the dashboard can offer a subject filter and a short, relevant topic list without inventing browser-side progress data.
