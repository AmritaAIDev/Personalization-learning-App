# Authenticated student workspace

Protected by `DashboardAccess`; the NestJS API remains the source of authorization.

| Route | Purpose |
| --- | --- |
| `/` | diagnostic status, adaptive topic suggestions, active/completed topics |
| `/learn` | adaptive journey — tutor + database flashcards |
| `/diagnostic`, `/diagnostic/[attemptId]` | start/resume a timed test, autosaving question flow |
| `/analysis/[attemptId]`, `/recommendations/[attemptId]` | submitted-test analysis and resource recommendations |
| `/practice` | reviewed practice entry point and topic selector |
| `/tests` | Tests command surface |
| `/notebook` | mistake/revision repair surface |
| `/doubts` | doubt entry, with client-side OCR (`@/lib/ocr`) on a photo/upload feeding the message box |
| `/profile` | authenticated profile, attempt/topic history |

`/arena` is a legacy compatibility route for older links — new links should point to `/practice`.
