# Student dashboard module

Read-only composition endpoint for the student home page. Reuses the diagnostic, adaptive, competency, and notebook services rather than duplicating their queries or storing a second dashboard projection. Never returns question text, answer keys, notebook solutions, or tutor messages. Throttled to 30 req/min.

`subjectCoverage` groups the published catalogue into topics and joins it with the signed-in student's adaptive topic state, so the dashboard can offer a subject filter without inventing browser-side progress data.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard/student` | progress, counts, scopes, and navigation metadata |
