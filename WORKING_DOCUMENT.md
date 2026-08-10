# JEE AI Working Document

This is the practical product logic reference for the platform. It explains the state model, tab behavior, learning algorithms, XP rules, and how the main UI areas connect to backend data.

## Product inspiration

The platform is original, but a few product ideas are inspired by proven learning patterns:

| Inspiration | Used for |
| --- | --- |
| Embibe | Weak-topic repair, practice evidence, test analysis |
| Khan Academy | Topic mastery, skill progress, next-step learning |
| Vedantu | Topic-linked doubt support |
| Toppr-style flows | Practice, review, retry, explanations |
| Modern productivity dashboards | One clear next action with compact signals |

## 1. Core state model

### User profile state

| Field | Meaning | Source |
| --- | --- | --- |
| `user.id` | Unique learner identity | Auth/session |
| `user.name`, `user.email` | Display and login identity | User table |
| `user.xp` | Total experience points | User table |
| `user.level` | Overall gamified level | Derived/resynced from XP |
| `user.streak` | Consecutive active days | User table |
| tier name | Rookie/Riser/etc. | Derived from `user.level` |

Current profile level rule:

```txt
Displayed user level = floor(user.xp / 250) + 1
Minimum level = 1
```

### Topic state

Stored per user + subject + chapter + topic.

| Field | Meaning |
| --- | --- |
| `currentLevel` | Adaptive topic level, 1-12 |
| `status` | Active, mastered, paused, etc. |
| `totalAnswered` | Total adaptive answers for the topic |
| `totalCorrect` | Total correct adaptive answers for the topic |
| `streakCounter` | Current in-topic correct streak |
| `lastActivityAt` | Latest topic activity |
| `masteredAt` | When the topic was mastered |

Clean rule:

```txt
Topic state is changed by Learn/adaptive practice, not by frontend UI state.
```

### Learning session and answer state

| State | Meaning |
| --- | --- |
| Learning session | One adaptive 5-question round for a topic level |
| Session transition | Advanced, reinforced, demoted, mastered, prerequisite |
| Answer record | Selected option, correctness, attempt number, elapsed time |

### Growth, review, and AI state

| State | Meaning |
| --- | --- |
| Growth/competency | Calculated from topic states, answer aggregates, level, speed, consistency |
| Review/notebook | Mistake and due-review cards created from wrong answers |
| Tutor/AI | Session-linked tutor messages, doubt answers, citations/sources |

### Frontend cache and refresh

The backend database is authoritative. The frontend only keeps short-lived, in-memory cache for speed.

```txt
mutation succeeds -> backend state changes -> frontend invalidates local view state -> fresh read
```

Used frontend helpers:

- optional in-memory read cache
- in-flight GET dedupe
- shared learning-data refresh event after workspace-affecting mutations

## 2. XP, user level, and tiers

### Current implemented XP

| Action | XP |
| --- | ---: |
| Correct adaptive Learn answer | +10 |

When XP changes:

```txt
user.xp increases
user.level is resynced
auth/dashboard/profile/journey refresh
+XP toast appears from real backend state
```

### Intended complete XP model

This should later move into an `xp_events` table.

| Action | Suggested XP |
| --- | ---: |
| Correct Learn answer first try | +10 |
| Correct Learn answer after hint | +5 |
| Complete Learn checkpoint | +20 |
| Advance topic level | +30 |
| Master topic | +100 |
| Submit Practice set | +20 |
| Practice score bonus | max +20 |
| Submit Test | +30 |
| Test score bonus | max +25 |
| Review due notebook item | +5 |
| Clear daily review queue | +20 |
| Daily streak activity | +10 |
| Flashcards | 0 for now |
| Doubts | 0 for now |

Clean rule:

```txt
XP controls overall user level.
XP does not control topic level.
```

### Tier names

```txt
Level 1+  -> Rookie
Level 5+  -> Riser
Level 10+ -> Scholar
Level 20+ -> Achiever
Level 35+ -> Topper
Level 50+ -> Legend
```

Example:

```txt
Level 4 user -> Rookie
```

## 3. Dashboard tab

Dashboard answers one question: **what should the learner do next?**

![Dashboard study plan UI reference](docs/ui-references/dashboard-study-plan.png)

### Your next step

Shows the best immediate action.

Decision order:

```txt
active diagnostic
-> due notebook/review mistakes
-> active topic state
-> suggested topic
-> choose a topic
```

### Today / action rail

Shows short actionable tasks for the day. It should stay compact and route the learner, not explain the whole system.

### Signals

Shows compact learner signals with hover/inline explanation.

| Signal | Meaning |
| --- | --- |
| Competency | Weighted topic score across tracked topics |
| Momentum | Latest timeline mastery percent - earliest timeline mastery percent |
| On track | Recent non-regressing checkpoint streak |
| Coverage | Mastered tracked topics / tracked topics |
| Review | Notebook repair cards due now |

### Course coverage

Shows tracked subject/chapter/topic coverage from the catalog plus topic states:

- weak/medium/strong topics
- current coverage
- chapter/topic progress

### Review queue

Shows mistakes or concepts due for repair. It comes from notebook/review state, not random dashboard data.

### Recent learning

Shows latest meaningful activity: Learn sessions, diagnostic attempts, practice/test records, notebook work, and doubt activity when included.

Major records are permanent. Feed-style history can be limited to recent items.

## 4. Journey tab

Journey shows route and growth summary.

| Metric | Meaning |
| --- | --- |
| XP earned | `user.xp` |
| Competency | Weighted learning score across tracked topics |
| On track | Recent non-regressing checkpoint streak |
| Steps cleared | Completed nodes in the selected route map |

Important distinction:

```txt
Journey = where the learner is moving
Profile = who the learner is becoming
Dashboard = what the learner should do next
```

## 5. Continue Learning / Learn tab

Learn is the main adaptive engine. It is the only area that directly changes topic level.

![Continue Learning topic workspace UI reference](docs/ui-references/continue-learning-topic-workspace.png)

### Topic level structure

```txt
1  Recall · Easy
2  Recall · Medium
3  Recall · Hard
4  Comprehension · Easy
5  Comprehension · Medium
6  Comprehension · Hard
7  Application · Easy
8  Application · Medium
9  Application · Hard
10 Higher-Order · Easy
11 Higher-Order · Medium
12 Higher-Order · Hard
```

### Baseline / placement

Placement reads prior evidence:

- same chapter answered count and accuracy
- same chapter mastered topics
- same subject answered count and accuracy
- same subject mastered topics
- prerequisite mastery
- peer/topic signal

Placement mapping:

```txt
readinessScore >= 6 -> Level 11
readinessScore 5    -> Level 9
readinessScore 4    -> Level 7
readinessScore 3    -> Level 5
readinessScore 2    -> Level 3
otherwise           -> Level 1
```

If topic state already exists:

```txt
resume saved topic level
```

### Level movement

Each adaptive round has 5 questions.

```txt
4/5 or 5/5 first-try correct -> advance one topic level
0/5 to 3/5 first-try correct -> stay same topic level
second failure on a question -> move down one level
Level 1 + second failure + prerequisite exists -> route to prerequisite
clear Level 12 -> topic mastered
```

### Learn updates

Learn updates:

- topic current level and status
- total answered/correct
- streak counter
- learning session transition
- tutor messages
- XP for correct answers
- profile level sync after XP

## 6. Tutor behavior

Tutor is linked to the current adaptive Learn question.

```txt
first wrong attempt -> hint only, correct answer hidden
second wrong attempt -> full explanation allowed
manual chat before reveal -> hint only
manual chat after reveal -> full explanation allowed
```

The correct answer is not sent to the tutor prompt before it is allowed to be revealed.

## 7. Flashcards

Flashcards are recall support, not grading.

Current rule:

```txt
Flashcards do not update topic level, mastery, competency, or user level.
```

They may use AI-generated cards and optional recall ratings, but the recommended XP is `0` for now.

## 8. Practice tab

Practice is for training and review evidence.

It updates:

- practice history
- score
- weak concepts
- review/notebook items
- recommendations
- future XP event model

It does not directly update topic level.

Clean rule:

```txt
Practice creates evidence.
Learn changes topic level.
```

## 9. Test tab

Test is exam-style assessment.

It updates:

- test history
- score
- weak areas
- analytics
- notebook/review queue
- recommendations
- future XP event model

It does not directly promote or demote topic level because test performance includes timing, mixed-topic pressure, and exam behavior.

## 10. Notebook tab

Notebook is the repair cockpit.

![Notebook repair workspace UI reference](docs/ui-references/notebook-repair-workspace.png)

It shows:

- due repair cards
- wrong-answer cards
- weak concept groups
- AI concept summaries
- rendered questions/solutions through markdown + KaTeX

It updates review state and dashboard next step. It does not directly update topic level.

Current source truth:

```txt
Notebook cards currently come from Learn/adaptive and Practice mistake flows.
Test mistakes should be wired into the same notebook source path when backend support is added.
```

## 11. Doubts tab

Doubts is a topic chat for learner questions.

![Doubts topic thread UI reference](docs/ui-references/doubts-topic-thread.png)

In a selected workspace:

- subject/chapter/topic are inherited automatically
- learner only types the doubt
- messages are grouped into continuing threads
- each message remains a backend record linked to `doubt_threads`

AI flow:

```txt
question -> backend doubt record -> AI answer -> saved answer + sources
```

Failure flow:

```txt
AI unavailable -> deterministic backend fallback answer -> status becomes ANSWERED
```

Doubts do not directly update topic level, mastery, or user level.

## 12. Profile tab

Profile owns identity, gamification, and skill shape.

![Profile skill and taxonomy UI reference](docs/ui-references/profile-skill-taxonomy.png)

It shows:

- user level, XP, streak
- XP/tier progress
- activity heatmap
- competency radar
- Bloom taxonomy view
- subject mastery
- compact milestones

Achievements are secondary. They should support motivation, not become the main measurement system.

## 13. What affects what

| Area | Affected by | Not directly affected by |
| --- | --- | --- |
| Topic level | Learn adaptive answers | XP, Practice, Test, Flashcards, Notebook, Doubts |
| User XP | Correct Learn answers now; future XP events later | Frontend-only UI actions |
| User profile level | `user.xp` | Topic level directly |
| Competency | Topic states, accuracy, difficulty, Bloom level, speed, consistency | Static frontend data |
| Dashboard recommendations | active topic, reviews, diagnostics, weak topics, recent activity | Manual fake UI state |
| Review queue | wrong answers, due notebook items, weak concepts | Flashcard-only activity |

## 14. Component interaction map

Short reference for the main visible controls.

| Component/control | What it does | Data/source |
| --- | --- | --- |
| Sidebar workspace card | Opens topic finder and sets current subject/chapter/topic workspace | question catalog + topic state |
| Dashboard search | Opens the same topic finder modal | question catalog + learning dashboard |
| Topic finder result | Selects topic and routes to Learn/Practice destination | selected catalog topic |
| Continue learning button | Opens selected topic in Learn workspace | active topic state |
| Learn answer option | Saves answer, grades server-side, updates topic/session/XP if correct | adaptive session API |
| Learn tutor chat | Gives hint/explanation based on answer reveal state | tutor API + session state |
| Flashcards start | Opens recall flow for selected topic | AI/card generation API |
| Flashcard rating | Moves to next card; no topic level or XP change for now | browser session state / optional future review state |
| Practice start | Creates reviewed practice attempt from database questions | question catalog + practice API |
| Practice submit | Scores attempt and creates review evidence | practice answers + backend scoring |
| Test start | Creates exam-style assessment | test/session API |
| Test submit | Stores score, weak areas, and recommendations | backend scoring/analysis |
| Notebook card | Shows mistake repair and concept summary | wrong answers + review state |
| Doubt message send | Saves message in thread and triggers AI/fallback answer | doubts API + `doubt_threads` |
| Profile widgets | Shows XP, level, taxonomy, competency, streak | user profile + growth data |

Rule:

```txt
One topic workspace should flow across Learn, Practice, Tests, Notebook, and Doubts.
No frontend-only fake data should decide state.
```

## 15. Security and stability guardrails

Implemented guardrails:

- session cookie auth with protected backend endpoints
- CORS restricted to configured frontend origins
- validation pipe with whitelist and non-whitelisted field rejection
- rate limiting on sensitive/high-traffic controllers
- no answer keys exposed before backend submission in exam-style practice
- AI calls isolated server-side in Agent/Notebook/Doubts services
- frontend cache is temporary memory cache, not source truth
- vulnerable frontend transitive packages pinned through safe overrides

Tracked item:

```txt
Backend @huggingface/transformers currently pulls sharp with an npm audit advisory
that has no patched release available yet.
```

## 16. Final product rule

```txt
Dashboard decides what the learner should do next.
Journey shows growth and route.
Learn teaches and changes topic level.
Practice trains and creates evidence.
Test measures readiness and creates stronger evidence.
Notebook repairs mistakes.
Doubts explains learner questions.
Flashcards support recall.
Profile shows gamified user progress from XP.
```
