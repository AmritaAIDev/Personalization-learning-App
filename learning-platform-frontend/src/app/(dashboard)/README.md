# Authenticated student workspace

Protected by `DashboardAccess`; the NestJS API remains the source of authorization.

| Route | Purpose |
| --- | --- |
| `/` | diagnostic status, adaptive topic suggestions, active/completed topics |
| `/journey` | curriculum map across subjects, chapters and topics |
| `/learn` | adaptive journey — tutor + database flashcards |
| `/diagnostic`, `/diagnostic/[attemptId]` | start/resume a timed test, autosaving question flow |
| `/analysis/[attemptId]`, `/recommendations/[attemptId]` | submitted-test analysis and resource recommendations |
| `/mock-test`, `/mock-test/[attemptId]` | full-syllabus mock test flow |
| `/practice`, `/practice/[attemptId]/review` | reviewed practice entry point, session review |
| `/tests` | Tests command surface |
| `/notebook` | mistake/revision repair surface |
| `/doubts` | doubt entry, with client-side OCR (`@/lib/ocr`) on a photo/upload feeding the message box |
| `/profile` | authenticated profile, attempt/topic history |
| `/topics` | legacy redirect to `/journey` |
