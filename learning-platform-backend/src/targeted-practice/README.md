# Targeted practice module

Shared on-demand single-question generation, deliberately outside the adaptive session state machine — generated, answered once, never advances a level or topic. Reused by two features:

- **"Practice this misconception"** — `reason: 'MISCONCEPTION'`, `focusText` is the Notebook's dominant classified misconception for a topic.
- **"Try a similar one"** — `reason: 'SIMILAR'`, `focusText` is a source question's text; the model stays isomorphic without repeating it verbatim.

Grounded the same way the adaptive pool worker grounds its batches (`count: 1` + a `focusHint`), gated by the same quality floor. A repeated request for the same `(user, subject, topic, reason, focusText)` within 10 minutes reuses the existing unanswered row instead of generating another.

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/targeted-practice/questions` | generate one focused question (no answer key in the response) |
| POST | `/api/targeted-practice/questions/:id/answer` | grade the single attempt (once only) |
