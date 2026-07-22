# Dashboard Experience Specification

This document explains the current dashboard behavior and the product reasoning behind it. It is intentionally written without technical implementation detail.

## 1. Dashboard Purpose

The dashboard is the learner's starting point. It should not feel like an admin page or a collection of feature cards.

Its job is to help the student answer three questions quickly:

1. What should I learn now?
2. Where did I leave off?
3. Do I need a starting diagnostic first?

The dashboard should feel calm, premium, and action-first. The student should not have to read long explanations before starting.

## 2. Current Dashboard Priority

The dashboard is organized in this order:

1. Welcome header
2. Search card
3. Baseline diagnostic prompt for new users only
4. Learning progress
5. Suggested next topics
6. Completed topics

This order is deliberate. Search is the main entry point because the product is topic-driven. The student usually comes with a concept in mind, so the platform should let them start from that concept immediately.

## 3. Search Card Behavior

The search card is the primary dashboard action.

Current behavior:

- The search bar is visible immediately after the header.
- The search bar is narrower than before so it feels more polished and less bulky.
- The label "Find your next challenge" is removed.
- The topic list is hidden by default.
- The old "Ready from your bank" text is hidden by default.
- Suggestions open only when the user taps or focuses the search field.
- Suggestions also update when the user types.
- Suggestions close after the user selects a topic.

Why this behavior is better:

- It keeps the dashboard clean on first load.
- It avoids showing a noisy topic list before the student asks for it.
- It makes search feel intentional, like a premium control.
- It prevents the page from looking crowded.

## 4. Search Suggestions

When the search field is active, the platform shows matching learning units from the question bank.

Each suggestion should help the student understand:

- the topic name
- the chapter it belongs to
- available question coverage across difficulty levels

The suggestions are not mock data. They come from the backend question catalog.

Loading behavior:

- Suggestions should use skeleton cards while loading.
- The page should not show partial or broken result sections.
- Results should fade in smoothly when ready.

## 5. Baseline Diagnostic Behavior

The baseline diagnostic is not the main product action. It is a starting check for new users.

Current behavior:

- It appears immediately after the search card only for new users.
- A user is treated as new when they have no completed diagnostic history and no active diagnostic attempt.
- It is highlighted enough to be noticed, but it stays compact.
- It shows the number of questions and time limit.
- It has one action: start baseline.
- Once the user has diagnostic history, the prompt is hidden.

Why this behavior is correct:

- New users may need an initial level check.
- Returning users should not keep seeing a basic setup prompt.
- Search remains the main entry point.
- Baseline stays useful without dominating the dashboard.

## 6. What Baseline Diagnostic Is For

The baseline diagnostic is a broad readiness check.

Its purpose is to:

- understand the learner's starting level
- identify weak areas before adaptive practice
- give the platform evidence instead of guessing
- help guide future recommendations

It is optional from a product hierarchy point of view. The student can still search a topic and begin learning directly.

## 7. Learning Progress Section

The learning progress section is the main dashboard body after search and baseline.

It should show:

- active topics
- the current stage of each active topic
- progress inside the topic
- a direct way to continue learning

This section is more important than baseline for returning users because it reflects the student's actual current journey.

## 8. Continue Learning Card

The Continue learning card should be the strongest card inside the learning progress section.

It should show active topics such as:

- topic name
- stage label
- current level or coordinate
- progress indicator
- continue arrow or action

Why this matters:

- It gives the student momentum.
- It answers "what was I doing?"
- It makes the platform feel continuous, not session-based.

## 9. Suggested Next Topics

Suggested topics should support the current learning journey without overpowering it.

Current design direction:

- Suggested topics use a light card, not a heavy dark card.
- They sit beside Continue learning on larger screens.
- They show why the topic is suggested.
- They show reviewed-question availability.

Why the dark card was removed:

- It made suggestions feel more important than active learning.
- It visually competed with the main progress card.
- It made the dashboard feel heavy.

## 10. Completed Topics

Completed topics should appear below the active route area.

They are useful for:

- showing progress history
- building learner confidence
- helping the student revisit mastered topics

They should not dominate the page. Completed work supports motivation, but the dashboard should still focus on what to do next.

## 11. Loading and Smoothness Rules

The dashboard should not show half-loaded UI.

Current rule:

- Search suggestions use skeleton cards.
- Learning progress uses skeleton cards.
- Baseline prompt uses skeleton text for its metadata.
- Transitions should feel smooth when sections open, load, or hover.

Why this matters:

- It prevents the page from feeling broken.
- It avoids random partial elements appearing during loading.
- It makes the product feel polished and production-ready.

## 12. What Was Removed

The following dashboard elements were intentionally removed or reduced:

- Large baseline diagnostic hero card
- Static adaptive route explanation card
- Separate diagnostics metric card
- Separate best score metric card
- Large learning record score card
- "Find your next challenge" label
- Default visible topic list under search
- "Ready from your bank" before search interaction

Why they were removed:

- They made the dashboard feel like an admin dashboard.
- They over-explained the product.
- They distracted from search and active learning.
- They created visual clutter.

## 13. Final Dashboard Intent

The final dashboard should feel like a premium learning control center.

The ideal first impression:

- clean welcome
- focused search
- helpful baseline only when needed
- clear active learning path
- light suggested next topics
- smooth loading
- no unnecessary explanation

In short:

The dashboard should help the student start or continue learning with almost no friction.

---

# Learn Page Experience Specification

This section explains the current Learn page behavior, the reason behind each interaction, and how the learning state changes behind the scenes. The goal is to make the Learn page feel like a professional adaptive learning workspace, not just a page with questions and a chat box.

## 14. Learn Page Purpose

The Learn page begins after a student selects a topic from search.

Its job is to help the student:

1. understand where they are in a topic
2. practise through a short adaptive question round
3. receive tutor support when they are stuck
4. review the topic with flashcards
5. move levels only when there is enough evidence

The Learn page is not a quiz arena. It is a guided topic workspace.

That means the design should feel focused, calm, and interactive. The student should feel like the platform is watching their progress and helping them move, not asking them to manually manage levels.

## 15. Empty Learn State

If the student opens the Learn page without a selected topic, the page shows a simple "Choose a topic first" state.

Current behavior:

- The page does not show fake topic information.
- The page does not open practice automatically.
- The only meaningful action is to return to search and pick a topic.

Why this is correct:

- Learn is topic-specific.
- Without a topic, there is no safe way to load questions, flashcards, tutor context, or progress.
- This avoids mock data and avoids confusing the student.

## 16. Topic Workspace Header

When a topic is selected, the Learn page shows a compact topic workspace header.

Current behavior:

- The selected topic appears clearly in the center area of the header.
- The chapter appears as a small supporting label.
- The current placement or stage appears as a small status label.
- The back-to-search button is compact.
- The old explanatory line "Progress, review, and practice for this topic" is removed.
- The header does not contain a second large practice button.

Why this is better:

- The topic is the main identity of the page.
- The header should orient the student, not consume too much screen space.
- The student already has tabs for actions, so repeating practice actions in the header creates clutter.
- A compact header leaves more room for the actual learning interaction.

## 17. Learn Page Tabs

The Learn page has three tabs:

1. Dashboard
2. Flashcards
3. Practice

The old combined "Quizzes and flashcards" idea was removed from this page.

Why quizzes were removed:

- The Learn page is meant for guided learning and adaptive practice.
- Quizzes belong better in a separate assessment or arena flow.
- Keeping quizzes here made the page feel mixed-purpose.
- Flashcards are a better companion to learning because they support recall and revision without interrupting the adaptive route.

## 18. Learn Dashboard Tab

The Learn dashboard tab gives a topic-level summary.

It should show:

- the current route or stage
- the current progress percentage
- the latest accuracy signal
- the topic status
- recent topic trail
- suggested next topics
- a clear continue-practice action

Why this exists:

- After selecting a topic, the student needs a quick understanding of "where am I in this topic?"
- The topic dashboard is not meant to be a full analytics page.
- It should support the next action, not overwhelm the student with metrics.

## 19. Continue Practice Button

The Continue practice button opens the Practice tab.

What happens when clicked:

1. The visible tab changes to Practice.
2. No question is submitted.
3. No level is changed.
4. No database mutation happens until the student starts or answers a practice round.

Why this is correct:

- Moving between tabs is only a navigation action.
- The system should not change learning state just because the student looked at the practice area.
- The database should change only when a meaningful learning action happens.

## 20. Topic Trail

The Topic trail shows recent saved checkpoint history for the selected topic.

It should show:

- the coordinate or level label
- the routing outcome
- a compact level indicator

Why this exists:

- It helps the student see that progress is persistent.
- It makes the adaptive system feel continuous.
- It gives context without requiring a full analytics screen.

## 21. Suggested Next Topics

Suggested next topics appear inside the Learn dashboard when the backend has enough evidence.

The suggestions should be light and supportive.

They should not dominate the page because the selected topic is still the main workspace.

What happens when a suggestion is clicked:

1. The Learn page opens with the suggested topic scope.
2. The selected topic changes.
3. The workspace refreshes from the backend.
4. The current question session state is cleared for the previous topic.
5. The new topic dashboard loads from saved database state.

Why this is correct:

- A suggested topic is a topic switch.
- The old topic's active UI state should not leak into the new topic.
- The backend remains the source of truth.

## 22. Flashcards Tab Purpose

The Flashcards tab is for recall and revision.

It is not a mock card deck and it is not a frontend-only feature.

Current behavior:

- Flashcards are loaded from the database.
- The tab shows the flashcard deck directly, without a separate instructional explanation card.
- The student can flip a card.
- The student can rate recall.
- The review rating is saved through the backend.
- The next review schedule is calculated by the backend.
- If a topic has no cards, the tab automatically requests AI-generated flashcards from the backend.

Why this is useful:

- Adaptive questions test reasoning.
- Flashcards strengthen memory and formulas.
- Spaced recall helps keep mastered topics durable.

## 23. AI Flashcard Generation

AI flashcard generation creates flashcards for the current topic.

What happens when the tab has no cards:

1. The frontend loads flashcards for the selected subject, chapter, and topic.
2. If the database returns an empty deck, the frontend automatically asks the backend to generate a grounded set.
3. The backend checks existing published flashcards for that topic.
4. If enough flashcards already exist, the backend returns the existing database cards.
5. If more cards are needed, the backend gathers reviewed database material for the topic.
6. DeepSeek generates flashcards only from that trusted material.
7. The backend validates the generated cards.
8. The backend saves them into the `flashcards` table as AI-generated published cards.
9. The frontend displays the saved database response.

Why this flow matters:

- The frontend never creates or stores fake flashcards.
- The AI does not generate from an open student prompt.
- The database becomes the source of truth immediately.
- Generated flashcards become reusable records, not temporary browser content.
- The student should not need to press a setup button just to get the first usable deck.

## 24. Flashcard Review Buttons

After flipping a card, the student can rate recall:

- Again
- Hard
- Good
- Easy

What happens when a rating is clicked:

1. The frontend sends the selected rating to the backend.
2. The backend finds the flashcard.
3. The backend finds or creates the student's review record for that flashcard.
4. The backend calculates the next due time.
5. The backend saves the review result.
6. The frontend moves to the next card.

Why this is correct:

- Review scheduling is learner-specific.
- The card content is shared, but review state belongs to each student.
- The frontend should not calculate spaced repetition timing by itself.

## 25. Practice Tab Purpose

Practice is the main learning area.

It should feel like a live tutoring interaction:

- one side shows the current question
- one side shows the linked tutor
- answering a question updates the tutor context
- wrong answers trigger hints or explanations
- level changes happen only after enough evidence

The student should not feel like they are filling a static quiz form. The experience should feel guided and responsive.

Practice should continue until the student chooses to stop, is routed to a different prerequisite topic, or masters the topic. Internally, the system still uses five-question checkpoints because level decisions need stable evidence, but the user experience should feel continuous.

## 26. Start Adaptive Practice Button

The Start adaptive practice button begins or resumes a five-question learning round.

What happens when clicked:

1. The frontend sends the selected subject, chapter, and topic to the backend.
2. The backend finds or creates the student's topic state.
3. The backend checks whether there is already an active session for this topic.
4. If an active session exists, it resumes that session.
5. If not, the backend chooses the student's current coordinate.
6. The backend selects five questions for that coordinate from the database or the learner's generated pool.
7. The backend excludes questions the learner has already seen for that topic coordinate.
8. If there are not enough unused ready questions, the backend can prepare or request more AI-generated questions for that coordinate.
9. The backend creates a learning session and session items.
10. The frontend receives only the current student-safe question.
11. The dashboard state refreshes after the round starts.
12. The backend prepares more unused questions for the current and next likely coordinate in the background.

Why this is correct:

- The student does not manually choose level.
- The backend owns placement and question selection.
- The frontend only displays the current allowed question.
- Existing active work is not duplicated.
- Questions should not repeat for the learner when unused alternatives exist or can be generated.
- The next round should usually be ready before the student clicks continue.

## 27. Question Card Behavior

The question card displays one question at a time.

Current behavior:

- The student sees the question text and answer options.
- The answer key is not sent as visible frontend state.
- When an answer is selected, the options are temporarily disabled.
- The UI shows a checking state instead of reloading the whole page.
- The backend grades the answer.
- The backend returns the next safe state.

Why this matters:

- The user experience feels live and smooth.
- The answer key remains protected.
- The frontend does not decide correctness.
- The learning route remains secure and consistent.

## 28. Linked Tutor Panel

The tutor panel is connected to the current learning session.

Current behavior:

- The tutor appears beside the question card in Practice.
- It loads the conversation for the active learning session.
- When the student answers incorrectly, the backend can create a hint or explanation message.
- The tutor message appears in the same flow instead of opening a separate page.
- The student can ask follow-up questions.
- Tutor responses are rendered in safe structured Markdown.

Why this matters:

- The tutor is not a generic chatbot.
- It understands the current question and attempt context.
- The student can ask "why" without losing the practice flow.
- The tutor supports learning without revealing answers too early.

## 29. First Wrong Answer Behavior

When the student answers incorrectly for the first time on a question, the system gives support without immediately revealing the answer.

What happens:

1. The backend records the attempt.
2. The backend checks that it is the first miss.
3. The question remains active.
4. The backend creates or returns a Socratic hint.
5. The correct answer and full solution are not included in the tutor prompt.
6. The frontend shows a retry state.
7. The tutor panel displays the hint.

Why this is correct:

- The student still has a chance to reason.
- The system helps without giving away the answer.
- This supports learning better than immediate correction.

## 30. Second Wrong Answer Behavior

When the student misses the same question again, the system gives a fuller explanation and updates the route.

What happens:

1. The backend records the second attempt.
2. The backend can now reveal the correct reasoning to the tutor service.
3. The tutor explains why the selected answer is wrong.
4. The tutor explains why the correct reasoning works.
5. The backend updates the student's learning evidence.
6. The session may route to reinforcement, demotion, prerequisite support, or completion depending on the state.

Why this is correct:

- After two misses, the student needs explanation more than another hidden hint.
- The route should respond to demonstrated difficulty.
- The system should not keep the student stuck in an endless retry loop.

## 31. Correct Answer Behavior

When the student answers correctly, the system records positive evidence.

What happens:

1. The backend records the answer.
2. The backend marks the session item as resolved.
3. The student moves to the next question if the round is not complete.
4. If the round is complete, the backend calculates the route outcome.
5. The frontend updates the progress bar and current question.

Why this is correct:

- Correct answers contribute to level movement.
- The student sees progress immediately.
- The backend remains responsible for deciding the next coordinate.

## 32. Five-Question Round Shape

Each adaptive practice round uses five focused questions.

Why five:

- It is short enough for a student to complete without fatigue.
- It gives more evidence than a single question.
- It creates a clear checkpoint for routing.
- It fits the 15-level structure cleanly.

The round should not feel like a long test. It should feel like a compact learning checkpoint.

From the student's point of view, practice does not need to stop after one checkpoint. After a checkpoint is completed, the student can continue into the next round immediately. The Stop for now action is the intentional exit.

## 33. Level and Coordinate System

The learning system uses 15 coordinates.

The structure is:

1. Remember - Easy
2. Understand - Easy
3. Apply - Easy
4. Analyze - Easy
5. Evaluate - Easy
6. Remember - Medium
7. Understand - Medium
8. Apply - Medium
9. Analyze - Medium
10. Evaluate - Medium
11. Remember - Hard
12. Understand - Hard
13. Apply - Hard
14. Analyze - Hard
15. Evaluate - Hard

The student does not choose these levels manually.

Why automatic placement is better:

- Students often overestimate or underestimate their level.
- Manual level choice creates inconsistent evidence.
- Automatic placement lets the system use actual performance.
- The platform feels adaptive rather than self-service only.

## 34. Initial Placement Logic

When a student begins a topic, the backend decides where to start.

The placement can come from:

- existing progress in the same topic
- evidence from the same chapter
- evidence from the same subject
- prerequisite evidence
- baseline diagnostic evidence
- a default starting point when no evidence exists

Why this is correct:

- The platform should reuse known learning history.
- A student should not restart from zero if there is already evidence.
- A new student can still begin safely from a foundation coordinate.

## 35. Level Improvement Logic

The student moves upward only when the evidence supports it.

A route can advance when:

- the student resolves the five-question round strongly
- mistakes are not repeated
- the current coordinate appears stable

The route can stay or reinforce when:

- the student gets some answers correct but not enough for a confident move
- the system needs more evidence
- the student needed hints before finishing

The route can move down when:

- the student misses the same idea repeatedly
- the current coordinate is too difficult
- accuracy suggests a weaker foundation

The route can move to a prerequisite when:

- the student is struggling at the lower levels
- the topic depends on a missing foundation
- a prerequisite relationship exists in the learning graph

Why this logic matters:

- The goal is not to punish the student.
- The goal is to choose the next most useful checkpoint.
- A professional adaptive system should be evidence-based, not random or manually controlled.

## 36. Question Repeat Prevention

Practice questions should not repeat for the same learner when the system has unused alternatives.

Current behavior:

1. Before selecting a question set, the backend checks the learner's previous session items for that topic and coordinate.
2. Previously used curated questions are excluded from the candidate pool.
3. Previously used generated questions are excluded from the candidate pool.
4. The backend counts only unused ready questions when deciding whether more AI-generated questions are needed.
5. If the unused pool is too small, the backend prepares or requests more questions instead of silently repeating old ones.

Why this matters:

- Repeated questions create false mastery.
- The student may remember the answer instead of understanding the idea.
- Adaptive level movement should be based on fresh evidence.
- Question variety keeps long practice sessions useful.

## 37. Mastery Logic

A topic is treated as mastered only when the learner clears the final required route evidence.

Mastery should mean:

- the student has progressed through the route
- the student has shown stable performance
- the final coordinate has enough successful evidence

When mastered:

- the topic can appear in completed topics
- the student can still review with flashcards
- the dashboard can suggest related next topics

Why this matters:

- Mastery should feel earned.
- Completed topics help motivation.
- Review remains available because memory fades over time.

## 38. Backend and Database Responsibilities

The backend is responsible for:

- user-specific topic state
- level and coordinate decisions
- question selection
- repeat prevention for previously used questions
- answer grading
- retry and explanation rules
- tutor conversation state
- flashcard generation and review scheduling
- dashboard progress and suggestions

The database stores:

- topic progress state
- learning sessions
- session question items
- submitted answers
- generated question pools
- flashcards
- flashcard reviews
- tutor conversations
- tutor messages

The frontend is responsible for:

- showing the selected topic workspace
- displaying the current safe state
- handling loading and interaction states
- calling the correct API endpoint
- never inventing progress, questions, answers, or flashcards

## 39. API Interaction Summary

The Learn page uses these major backend actions:

- load dashboard summary
- start or resume a learning session
- submit an answer
- load tutor conversation
- send tutor message
- load flashcards
- generate flashcards
- review flashcard

Each API call should have:

- a clear loading state
- a clear error state
- no full-page reload
- no duplicate submission
- no frontend-only fallback data

Why this matters:

- Professional software should feel reliable even when the network is slow.
- The student should always know whether the system is working.
- Data should stay consistent with the backend.

## 40. Loading and Smoothness Rules for Learn

The Learn page should not show broken partial sections.

Current rules:

- Dashboard loading uses skeleton cards.
- Flashcard loading uses skeleton cards.
- Starting practice shows a focused button loading state.
- Answer submission disables the question options.
- Tutor loading happens inside the tutor panel.
- The page should not fully refresh after answer submission.

Why this matters:

- The practice flow should feel live.
- The student should not lose context.
- Smooth loading makes the platform feel production-ready.

## 41. Security and Correctness Rules

The Learn page must protect learning data.

Rules:

- The frontend must not receive answer keys before allowed.
- The frontend must not decide correctness.
- The frontend must not create fake flashcards.
- The frontend must not store mock progress.
- AI generation must be grounded in reviewed database material.
- Tutor prompts must not reveal answers during the first wrong attempt.
- All user actions must be tied to the authenticated user.

Why this matters:

- The platform is an educational assessment and learning system.
- Trust depends on correctness and secure handling of answers.
- Students should not be able to bypass the learning flow through frontend data.

## 42. Final Learn Page Intent

The final Learn page should feel like a premium adaptive learning studio.

The ideal experience:

- the student searches and selects a topic
- the workspace opens with clear topic identity
- the dashboard explains the current route briefly
- flashcards support recall without clutter
- practice becomes the main interactive area
- the tutor feels connected to the current question
- levels change automatically from evidence
- all data comes from backend and database flows

In short:

The Learn page should feel like a guided intelligent tutor, with the backend quietly managing state, evidence, routing, and persistence.
