# JEE AI Product PRD + Information Architecture

## Product goal

JEE AI is a personalized learning workspace for JEE aspirants. The product should feel like a calm, premium study cockpit: students search a topic, receive a clear next step, practice continuously, and see progress without manually choosing their level.

The first priority is UI structure and learning workflow clarity. Advanced AI can be deepened later, but the interface must already feel like a serious, scalable platform.

## Research baseline

Competitive patterns reviewed:

- Embibe: deep adaptive practice, knowledge graphs, hints, attempt-quality labels, and next-question sequencing.
- MathonGo / Quizrr: strong testing product, real exam interface, detailed analysis, mistake notebook, revision notebook.
- ALLEN Digital: custom practice by subject/topic/question count.
- Unacademy Iconic: personal coach, study planner, bi-weekly review, personalized test analysis.
- PhysicsWallah digital books: integrated reading, AI explanation, video, PYQs, highlights, personal notes.
- TestonGo / PracticeJEE: weak-topic practice, AI analysis, mistake analyzer, daily short sets, real exam mocks.
- New AI study tools: compact dashboards, AI doubts, flashcards, focus sessions, smart revision.

Decision for our product:

- Do not become a generic course/video platform first.
- Do not make the student manually choose Bloom level or difficulty.
- Keep Search as the main entry point.
- Make Dashboard a control center, not a marketing landing page.
- Make Learn the deep topic workspace.
- Make Practice a continuous tutor-like loop.
- Keep Tests separate from Learn so learning and exam simulation do not fight each other.
- Make Notebook and Doubts context-aware support layers.

## Core user journey

1. Student opens account.
2. Student lands on Dashboard.
3. Dashboard shows a central search command and the next best action.
4. If the student is new, a compact baseline diagnostic is highlighted immediately after search.
5. Student searches a concept, chapter, or weak topic.
6. Selecting a result opens Learn for that topic.
7. Learn shows topic status, flashcards, and practice studio.
8. Practice studio asks questions continuously until the student stops.
9. The tutor panel stays linked to the current question and explains wrong answers.
10. The backend updates the student’s level only from answer evidence.
11. Mistakes flow into Notebook.
12. Doubts stay attached to topic, question, and level context.
13. Tests provide exam-style practice and post-attempt analysis.

## Global navigation

- Dashboard: command center, search, baseline prompt, readiness, active route.
- Journey: visual map of subject/chapter/topic progression.
- Learn: selected-topic workspace.
- Practice: standalone practice entry and focused sessions.
- Tests: diagnostic, mocks, timed practice, review reports.
- Notebook: mistakes, bookmarks, revision repairs.
- Doubts: context-linked tutor/doubt hub.
- Baseline: first diagnostic route.
- Curriculum: PCM hierarchy and topic catalog.
- Content: admin-only question/content management.

## Dashboard PRD

### Purpose

Dashboard answers one student question: “What should I do next?”

It should not overwhelm the student with every metric. It should show:

- Search command.
- New-user baseline prompt.
- Current learning route.
- Subject/chapter readiness.
- Active topics.
- Suggested next topics.

### Dashboard UI hierarchy

1. Compact welcome row.
2. Large command/search card centered visually.
3. New-user baseline diagnostic card, only when there is no history.
4. Readiness/growth card using real backend progress.
5. Active learning and suggested topic cards using real learning dashboard data.

### Search behavior

- Search is closed by default.
- Suggestions appear only after focus or typing.
- Results come from the backend question catalog.
- Selecting a result opens Learn for that topic.
- Search should support concept, chapter, and practice-unit language.

### Baseline diagnostic behavior

- New account: show immediately after search.
- Existing account with learning/test history: hide.
- Button starts backend diagnostic attempt.
- Diagnostic is for placement evidence, not the main learning experience.

## Learn PRD

### Purpose

Learn is the selected-topic workspace. It should feel like the student is inside one focused topic, not browsing the whole app.

### Tabs

- Dashboard: topic status, current level, next focus, route explanation.
- Flashcards: generated live by AI when needed; not stored permanently as frontend mock data.
- Practice Studio: continuous question + tutor interaction.

### Topic workspace behavior

- If no topic is selected, show “Find a topic” and route to search.
- If a topic is selected, show compact topic context at top.
- Do not show manual level selectors.
- The system chooses level from backend evidence.

## Practice Studio PRD

### Purpose

Practice is the main learning engine. It should feel like a tutor conversation around questions, not a static quiz.

### Behavior

- Questions continue until the student stops.
- Questions should not repeat within the active learning route unless intentionally used for repair.
- Current question card and tutor card stay visually connected.
- Correct answer: tutor confirms and optionally gives exam insight.
- Wrong first attempt: tutor gives a hint/explanation and allows retry where appropriate.
- Wrong second attempt: backend may demote level or route to prerequisite.
- Student can ask follow-up questions in the tutor panel.

### Level change logic

- Complete all questions in a strong streak: advance one level.
- Not strong enough: stay at same level for reinforcement.
- Fail twice on a question and current level is above 1: move down one level.
- Fail at Level 1 and topic has prerequisite: pause topic and route to prerequisite.
- Clear final level: mark topic mastered.

## Tests PRD

Tests are separate from Learn. They are used for exam temperament, timing, and analytics.

Required surfaces:

- Baseline diagnostic.
- Timed mock/sectional practice.
- Reviewed attempts.
- Attempt analysis.

## Notebook PRD

Notebook is not a static notes page. It is an evidence-driven repair layer.

It should contain:

- Mistake cards.
- Bookmarked questions.
- Misconception explanations.
- Due revision items.
- “Practice similar” actions.

Notebook data must come from backend attempts, not frontend mock rows.

## Doubts PRD

Doubts must be contextual.

Each doubt should be saved with:

- Student ID.
- Topic/chapter/subject.
- Current level.
- Related question/session item when available.
- Chat transcript or tutor response.

## Visual direction

- Premium, calm, student-first.
- Dense enough for serious preparation, but not cluttered.
- Soft cards, strong hierarchy, restrained color.
- Search and next action should dominate Dashboard.
- Use skeletons and smooth transitions for async areas.
- Empty states must be honest and useful.

## Implementation architecture

### Frontend

- `app/(dashboard)` owns authenticated product pages.
- `components/product` owns reusable product layout primitives.
- `components/dashboard` owns Dashboard-specific panels.
- `components/learning` owns Learn and Practice Studio.
- `components/search` owns topic search behavior.
- `lib/*` owns API helpers and typed route helpers.

### Backend

- Questions remain database-backed.
- Learning state remains database-backed.
- Level changes happen in backend adaptive services only.
- Flashcards are live AI generation unless a future spaced-repetition product explicitly stores them.
- Doubts and Notebook need dedicated backend modules before history lists appear in the UI.

## Build phases

### Phase 1: UI restructure

- Dashboard command center.
- Professional navigation model.
- Practice, Tests, Notebook, Doubts surfaces.
- Learn page compact topic workspace.
- Remove fake frontend data.

### Phase 2: Data wiring

- Notebook API.
- Doubts API.
- Test mode APIs.
- Real readiness/chapter map endpoints.

### Phase 3: Advanced AI

- Better tutor streaming.
- Live flashcard generation improvements.
- Question generation fallback.
- Personalized explanation style.

### Phase 4: Scale and quality

- Admin content QA.
- Security review.
- Performance and caching.
- Analytics and observability.
