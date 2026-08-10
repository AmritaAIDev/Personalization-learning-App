# Learning Platform Product Flow Specification

This document explains the application in a simple product-flow format. It says what the student sees, what each page or button does, what happens after every important action, and how the learning engine changes the student's saved level and learning state.

The document avoids deep engineering language wherever possible. Technical details are included only when they explain product behavior.

## 1. Main idea of the platform

The platform is a personalized learning system.

The student does not manually choose a level. The system watches the student's history, topic progress, answers, mistakes, and mastered topics. From that evidence, it automatically decides where the student should start, what question should come next, when the student should move up, when the student should repeat, and when the student should go back to a prerequisite.

The main learning loop is:

1. The student signs in.
2. The student searches for a topic.
3. The platform opens a topic workspace.
4. The student learns through practice questions, flashcards, and tutor support.
5. Every answer updates the student's saved learning state.
6. The platform uses that saved state to decide the next checkpoint.

## 2. Account opening and first screen

### 2.1 If the student is not logged in

The student first sees the login or signup experience.

Login page:

- The student enters email and password.
- The student clicks Login.
- If the details are correct, the backend creates a secure session and the student enters the platform.
- If the details are wrong, the page shows a clear error and stays on login.

Signup page:

- The student creates an account.
- After signup, the backend creates the user account and session.
- The student is taken into the platform.

What happens in the background:

- In production, the frontend sends login/signup through its own `/api` path.
- The platform routes that request to the backend internally so the browser session stays on the frontend site.
- In local development, the frontend can still call the configured local backend API.
- The backend validates the request.
- The backend stores the session securely.
- The frontend does not store secret keys or passwords.

### 2.2 After login or signup

The student lands on the Dashboard.

The Dashboard is the starting point of the product. It should feel calm, premium, and direct. The main action is search. The student should not be overloaded with unnecessary cards.

## 3. Main navigation after login

The signed-in area has these main destinations:

- Dashboard: search, active learning, suggested topics, and progress.
- Learn: the topic workspace where topic-specific learning happens.
- Arena or diagnostic area: optional diagnostic or test-style flow when needed.
- Profile: account and student details.

The most important path is Dashboard -> Search topic -> Learn page -> Practice studio.

## 4. Dashboard page

The Dashboard should answer one question: what should the student learn next?

### 4.1 What appears on the Dashboard

The Dashboard contains:

- A compact search area.
- A shared topic-search dialog that can be opened from Dashboard search or the sidebar workspace selector.
- Topic suggestions that stay hidden until the student opens search.
- A baseline diagnostic card only for a new student who has not completed it.
- A current learning desk that shows the next useful action for the student.
- Active topic or workspace status when it helps the student resume.
- Review, history, and record information only where it helps the student continue.

The Dashboard should not feel like a report page. It should feel like the learning starting point.

### 4.2 Search behavior

What the student sees:

- The search bar is visible near the top.
- The same search component can also open from the sidebar workspace selector.
- Suggested topics are not shown immediately on the page.
- When the student opens search, a centered topic picker appears.
- The student can type a topic name.
- The student can select a topic result.
- Search results can show subject, chapter, topic, and a small progress/readiness signal when the backend has that data.

What happens after selecting a topic:

- The app opens the Learn page for that selected subject, chapter, and topic.
- If the student already has progress for that topic, the Learn page resumes the saved state.
- If the topic is new, the backend creates the first learning state automatically.

What happens in the background:

- Search results come from the backend/database.
- The frontend should not hardcode topic lists as mock data.
- The backend returns verified topics and question availability where possible.
- Selecting a topic updates the shared workspace context used by Dashboard, Learn, Practice, Tests, Notebook, and Doubts.

### 4.3 Baseline diagnostic card

The baseline diagnostic is not the main product. It is useful only when the student is new and the system has no evidence.

When it appears:

- It appears immediately below search for a new account.
- It should be visually highlighted because it helps the platform understand the student.
- It should not appear as a large permanent block for old users.

When it disappears:

- After the student completes the baseline diagnostic.
- When the student already has enough saved learning evidence.

What the button does:

- Start baseline opens the diagnostic flow.
- The diagnostic result is saved.
- The result can influence future placement and suggestions.

Why it exists:

- It gives the system an initial signal when no learning history exists.
- It reduces random placement for the first few topics.

### 4.4 Continue learning card

What the student sees:

- Active topics they have already started.
- Current checkpoint or stage.
- A small progress indication.
- A resume action for the selected workspace topic.

What happens when clicked:

- The Learn page opens for that topic.
- The topic resumes from the saved level and session state.

### 4.5 Suggested next topics

What the student sees:

- A small set of topics related to completed or active learning.
- Each suggestion explains why it is being shown in simple words.

What happens when clicked:

- The Learn page opens for that suggested topic.
- The backend creates or resumes the student's topic state.

How suggestions are chosen:

- Topics from the same chapter as recent activity are preferred.
- Topics unlocked by mastered prerequisites are preferred.
- Completed topics are not suggested again as new topics.

## 5. Learn page

The Learn page is the topic workspace.

It should feel like: “I selected a topic. Now everything I need for this topic is here.”

### 5.1 If no topic is selected

What the student sees:

- A clean empty state.
- A Find a topic action.

What happens:

- The student is guided back to search.
- No fake topic or mock data is shown.

### 5.2 If a topic is selected

What the student sees:

- A compact topic workspace header.
- The topic name.
- Subject and chapter context.
- Current stage, such as Foundation check or Concept builder.
- A small Back to search action.
- Tabs for Dashboard, Flashcards, and Practice studio.

Important UI rule:

- The topic workspace card should be compact.
- It should not dominate the page.
- The page should quickly lead the student toward practice.

## 6. Learn page tabs

### 6.1 Topic Dashboard tab

Purpose:

- Shows the student's current status for this topic.
- Helps the student understand what is happening next.

What appears:

- Current checkpoint.
- Current stage label.
- Accuracy or progress summary.
- Continue practice action.
- Recent learning path or history for this topic.
- Suggested next action.

What happens when Continue practice is clicked:

- The Practice studio starts or resumes an adaptive practice session.

What this tab should not do:

- It should not ask the student to manually choose a level.
- It should not duplicate the global Dashboard.
- It should not show unnecessary quiz blocks.

### 6.2 Flashcards tab

Purpose:

- Helps the student revise key ideas of the selected topic.
- It supports memory and concept recall, but it is secondary to adaptive practice.

What appears:

- Flashcards for the current topic.
- Flip card action.
- Recall rating buttons such as Again, Hard, Good, and Easy.

What happens when the student opens the tab:

- The frontend asks the backend whether any live flashcard set is already available for the selected view.
- The normal flow is live generation: the student taps generate, and the backend asks DeepSeek through the backend AI service.
- The backend generates a small batch and returns it directly to the current screen.
- When the student is near the end of the visible batch, the next batch can be prepared so the flow feels continuous.
- Generated flashcards are not saved in the flashcards database table.

What happens when the student rates a card:

- The rating moves the local live deck forward.
- The current implementation does not save live flashcard ratings as spaced-repetition records.
- This keeps flashcards lightweight and avoids filling the database with temporary AI cards.

Important rule:

- Flashcards should come from backend generation or backend-controlled data.
- The frontend should not contain temporary flashcard content.
- Flashcard review buttons are for the current live recall flow; they are not a formal test score.

### 6.3 Practice studio tab

Purpose:

- This is the main learning feature.
- It combines adaptive questions and tutor support in one connected space.

What appears:

- Left side or main area: current question card.
- Right side or connected area: tutor chat.
- The two areas should feel linked, not like separate tools.

The student experience:

- The student starts practice.
- A question appears.
- The student selects an answer.
- The tutor reacts based on that exact question and answer.
- The system decides whether to move forward, give a hint, explain, repeat, move up, move down, or route to a prerequisite.
- The page should avoid full-page reloads between answers.
- The question area should stay compact while tutor/chat content can scroll independently.

Important rule:

- Practice should continue until the student chooses to stop.
- Internally the system uses five-question checkpoints, but the experience should feel continuous.
- After one five-question set finishes, the next set should be prepared so the student can continue without feeling blocked.

## 7. Practice studio button and action behavior

### 7.1 Start adaptive practice

When clicked:

- If there is an active session, the backend resumes it.
- If there is no active session, the backend creates a new five-question session at the student's current saved checkpoint.
- If the exact checkpoint does not have enough questions, the backend tries a nearby ready checkpoint.
- If still not enough, the backend tries a calibration set from the same topic or chapter.
- If content is still missing, the backend starts AI generation and asks the student to try again shortly only if a full set cannot be prepared yet.

### 7.2 Selecting an answer

When the student selects an answer:

- The frontend sends the selected option to the backend.
- The backend checks the answer.
- The backend saves the attempt.
- The backend updates the learning state.
- The backend returns the updated session and tutor feedback.

The correct answer is checked on the backend, not trusted from the frontend.

### 7.3 Correct answer

If the answer is correct:

- The question is marked resolved.
- The student's total answered count increases.
- The student's total correct count increases.
- The streak counter increases.
- The student receives XP.
- The session moves to the next question.
- If it was the last question of the set, the backend checks whether the student should advance.

### 7.4 First wrong answer

If the answer is wrong for the first time on that question:

- The system does not immediately reveal the final answer.
- The attempt is saved.
- The streak counter resets.
- The tutor gives a Socratic hint.
- The student gets another chance on the same question.

Why:

- A first mistake should become a learning moment, not a failure screen.
- The tutor should help the student think again without breaking the flow.

### 7.5 Second wrong answer

If the student answers the same question wrong again:

- The system saves the second attempt.
- The question is resolved.
- The tutor explains why the selected answer is wrong.
- The tutor explains why the correct answer is right.
- The current five-question session ends early.
- The backend decides whether to reinforce, demote, or route to a prerequisite.

Why:

- Repeating wrong answers means the current checkpoint may be too high or a prerequisite may be weak.

### 7.6 Continue next set

When a set ends and the student continues:

- The frontend asks the backend for the next session.
- The backend uses the latest saved learning state.
- The backend serves a fresh five-question set.
- Previously used questions are excluded so questions do not repeat.

### 7.7 Stop for now

When the student stops:

- The current saved state remains in the database.
- The student can return later from Dashboard or Learn.
- The next visit resumes from the latest saved checkpoint.

## 8. Learning levels

The current adaptive route has 12 checkpoints.

It is built from 4 proficiency stages and 3 difficulty levels:

- Recall: remembering definitions, facts, and basic relationships.
- Comprehension: understanding meaning and explaining ideas.
- Application: using the concept in standard problems.
- Higher-Order: analyzing, evaluating, and creating multi-step reasoning.

Each proficiency stage has:

- Easy
- Medium
- Hard

So the full route is:

1. Recall - Easy
2. Recall - Medium
3. Recall - Hard
4. Comprehension - Easy
5. Comprehension - Medium
6. Comprehension - Hard
7. Application - Easy
8. Application - Medium
9. Application - Hard
10. Higher-Order - Easy
11. Higher-Order - Medium
12. Higher-Order - Hard

The student does not pick these levels. The backend decides the current level.

## 9. How the first level is chosen

When a student opens a topic for the first time, the backend creates a learning topic state.

The starting level is based on available evidence:

- Same chapter performance.
- Same subject performance.
- Mastered prerequisite topics.
- Average level reached in related topics.
- Baseline diagnostic evidence when available.
- If no useful evidence exists, the student starts from Level 1.

Example:

- A new student with no history starts from Level 1.
- A student who mastered related chapter topics may start higher.
- A student who performed weakly in nearby topics starts lower.

This prevents the platform from asking the student to manually self-select a level.

## 10. How the level changes

Each practice session has five questions.

### 10.1 Moving up

The student moves up only when the evidence is strong.

A move up happens when:

- The student completes the five-question set.
- The student answers all five correctly strongly enough to maintain the required streak.
- The backend decides the checkpoint is cleared.

Then:

- The topic state current level increases by one.
- The next checkpoint is prepared.
- If the student was already at the final checkpoint, the topic becomes mastered.

### 10.2 Staying at the same level

The student stays at the same level when:

- The session is completed, but the streak is not strong enough.
- The student needs more reinforcement at the same checkpoint.

Then:

- The current level remains the same.
- A new five-question set is prepared at the same level.
- Used questions are excluded.

### 10.3 Moving down

The student moves down when:

- The student gets a question wrong twice.
- The current level is above Level 1.

Then:

- The current level decreases by one.
- The student gets practice at the easier previous checkpoint.
- The tutor explains the mistake.

### 10.4 Routing to a prerequisite

The student is routed to a prerequisite when:

- The student fails at Level 1.
- The topic has a known prerequisite.
- The backend finds a valid prerequisite topic with available questions.

Then:

- The current topic can be paused.
- The suggested prerequisite becomes the next learning target.
- The student can strengthen the missing base before returning.

### 10.5 Mastering a topic

A topic is mastered when:

- The student clears the final checkpoint.

Then:

- The topic state status becomes Mastered.
- The mastered date is saved.
- Dashboard can use that topic to suggest new related topics.

## 11. What is saved in the database for the student

The main saved state is the learning topic state.

For each student and topic, the database stores:

- Student id.
- Subject.
- Chapter.
- Topic.
- Current level.
- Current status: Active, Mastered, or Paused for prerequisite.
- Current streak.
- Total answered.
- Total correct.
- Last activity time.
- Mastered time if completed.

This state is the source of truth for the student's learning path.

The frontend should display this state, not invent it.

## 12. What is saved for each practice session

Each practice session stores:

- Student id.
- Topic state id.
- Subject, chapter, and topic.
- Level.
- Proficiency stage.
- Difficulty.
- Status: Active, Completed, or Routed.
- Transition result: None, Advanced, Reinforce, Demoted, Prerequisite, or Mastered.
- Total questions.
- Current question number.
- Started time.
- Completed time.

Each question inside the session stores:

- Its order in the session.
- Whether it came from the curated bank or AI-generated pool.
- The linked question id.
- Whether it is resolved.

Each answer attempt stores:

- The question item id.
- Attempt number.
- Selected option.
- Whether it was correct.
- Time spent if available.
- Created time.

This creates a complete learning record.

## 13. Question database format

There are two question sources.

### 13.1 Curated question bank

These are reviewed platform questions.

Each question should include:

- Subject.
- Chapter.
- Topic.
- Subtopic if available.
- Question text.
- Options.
- Correct answer.
- Solution or explanation.
- Bloom/proficiency label.
- Difficulty.
- Concept tags.
- Common error tags.
- Publication status.

Only published questions are used for students.

### 13.2 AI-generated question pool

These are learner-specific generated questions.

They are stored separately from the global question bank.

Each generated question includes:

- Student id.
- Generation job id.
- Subject.
- Chapter.
- Topic.
- Proficiency stage.
- Difficulty.
- Question text.
- Options.
- Correct answer.
- Solution.
- Hint.
- Concept tags.
- Common errors.
- Status: Ready, Reserved, or Rejected.

Why generated questions are separate:

- They are personalized.
- They should not automatically become public questions.
- They can be reviewed later before joining the curated bank.

## 14. How questions are selected

When the backend needs a five-question set, it follows this order:

1. Look for ready AI-generated questions for that student and checkpoint.
2. Look for published curated questions for that topic and checkpoint.
3. Remove questions the student has already used for that topic/checkpoint.
4. Shuffle the remaining candidates.
5. Select five questions.

If fewer than five are available:

- The backend tries nearby ready checkpoints.
- The backend tries a calibration set from the same topic or chapter.
- The backend creates or runs an AI generation job.

Important rule:

- Questions should not repeat for the same student in the same topic path.
- The backend tracks used question ids through session history.

## 15. AI generation behavior

DeepSeek is used through the backend AI service, not directly from the frontend.

AI can generate:

- Practice question batches.
- Flashcards.
- Tutor explanations and hints.

For question generation:

- The backend collects source material from existing reviewed questions.
- The backend can also use reviewed concept chunks from the RAG/vector database when available.
- The backend asks DeepSeek for questions at the correct topic, proficiency stage, and difficulty.
- The generated questions are saved in the database.
- The questions become available as Ready.
- When a generated question is used in a session, it becomes Reserved.

For flashcard generation:

- The backend uses reviewed question material as grounding.
- The backend can use RAG concept chunks as supplemental grounding when they are available.
- DeepSeek generates a fresh live deck for the current topic.
- The generated cards are returned to the frontend immediately.
- The generated cards are not saved in the database.

For tutor and doubt answers:

- The tutor first uses the current question, answer attempt, topic state, and reviewed database material.
- If RAG sources are configured, the backend retrieves a few relevant concept chunks.
- RAG citations are optional support, not the source of truth.
- If the vector database is slow or empty, the student still gets a response from reviewed database material and the model prompt.

Latency rule:

- The platform should prepare current and next checkpoint content early.
- The student should not feel a long pause after every answer.
- AI generation should happen in batches, not one question at a time during the visible learning flow.

## 16. Tutor and practice connection

The tutor is not a separate generic chatbot.

It is connected to:

- The current session.
- The current question.
- The student's selected answer.
- Whether the correct answer has already been revealed.
- The student's topic and level.

### 16.1 When the student asks a normal question

The tutor responds in context of the current topic and session.

It can:

- Explain the concept.
- Break down the question.
- Give a hint.
- Clarify a wrong option.
- Help the student think through the next step.

### 16.2 When the student gets the first attempt wrong

The tutor gives a hint.

It should:

- Avoid revealing the final answer immediately.
- Point to the relevant concept.
- Encourage the student to try again.

### 16.3 When the student gets the second attempt wrong

The tutor gives a full explanation.

It should:

- Explain why the selected answer is wrong.
- Explain why the correct answer is right.
- Explain the concept clearly.
- Suggest what to focus on next.

### 16.4 Tutor formatting

Tutor responses should be clean and readable.

They should use:

- Short paragraphs.
- Simple bullets when helpful.
- Step-by-step reasoning for math or physics problems.
- No broken markdown.
- No huge walls of text.

## 17. Continuous practice expectation

The visible experience should be continuous.

The system may use five-question sessions internally, but the student should feel:

- I answer a set.
- I receive feedback.
- I continue to the next set if I want.
- I stop only when I choose to take a break.

After every set:

- The backend finalizes the session.
- The backend updates the topic state.
- The frontend shows the result and next action.
- The backend prepares the next relevant content.

## 18. What happens when content is missing

If a topic does not have enough ready questions:

- The backend should not fake frontend data.
- The backend should generate or prepare content.
- The UI should show a clear preparing state.
- The student should be guided to try again shortly or review flashcards if available.

The message should be calm and specific, not confusing.

Example:

- “We are preparing a fresh five-question set for this checkpoint. Try again shortly.”

## 19. Security and data rules

The application must follow these rules:

- No secrets in frontend code.
- API URLs must come from environment variables.
- Backend URL must not be hardcoded into many frontend files.
- In production, frontend API calls should use the same-origin `/api` path and be routed to the backend by deployment config.
- In local development, frontend can use the configured backend API base URL.
- Backend should allow only the correct frontend origin in production.
- Login sessions should use secure cookie behavior in production.
- Correct answers should be checked on the backend.
- The frontend should never be trusted as the source of truth for scoring or level movement.
- All major data must come from the database through backend APIs.

## 20. What each main API flow is responsible for

Authentication:

- Create account.
- Login.
- Logout.
- Check current user.

Dashboard:

- Return active topics.
- Return completed topics.
- Return recent history.
- Return suggested next topics.
- Return whether baseline diagnostic is needed.

Search:

- Return verified topics from the database.
- Open the selected topic workspace.

Adaptive practice:

- Create or resume a session.
- Return current question without exposing the answer.
- Save answer attempt.
- Return feedback.
- Update topic state.
- Decide level movement.
- Prepare future content.

Flashcards:

- Return an empty stored deck by default.
- Generate live flashcards through backend AI.
- Do not save generated flashcards.
- Treat card ratings as local deck navigation, not a database review update.

Tutor:

- Load session conversation.
- Answer student messages in context.
- Create hints after first wrong attempts.
- Create explanations after second wrong attempts.

RAG and content grounding:

- Store reviewed concept chunks in the vector database by subject, chapter, topic, subtopic, concept, and source.
- Use those chunks for tutor/doubt grounding when available.
- Keep PostgreSQL as the source of truth for questions, answers, scoring, level movement, and student history.
- Never depend on RAG availability for core practice to work.

## 21. Demo and seeded data expectation

The platform should have a reliable demo learner for testing production-like flows.

Demo account:

- Email: `demo.student@jeeai.local`
- Password: `Demo@12345`

What the demo seed should include:

- A real user account with a secure hashed password.
- Active and mastered topic states.
- Baseline diagnostic history.
- Submitted practice attempts with mistakes.
- Doubts with tutor-style answers.
- Course coverage across existing topics and subtopics.
- Question-bank top-ups so practice and learning do not show empty states unnecessarily.

What should not happen:

- The frontend should not invent demo cards or temporary topic data.
- The demo seed should not delete real learner data.
- RAG content should be seeded through Qdrant/vector scripts, not copied into frontend components.

## 22. Simple end-to-end example

Example student flow:

1. Student signs up.
2. Dashboard opens.
3. Baseline diagnostic appears because the account is new.
4. Student searches “Gauss Law”.
5. Student selects Gauss Law.
6. Learn page opens.
7. Backend creates a Gauss Law learning state.
8. Because the student has no history, the state starts at Level 1: Recall - Easy.
9. Student opens Practice studio.
10. Student clicks Start adaptive practice.
11. Backend creates a five-question session.
12. Student answers question 1 correctly.
13. Backend saves the answer, increments progress, and moves to question 2.
14. Student answers question 2 wrong.
15. Tutor gives a hint without revealing the final answer.
16. Student tries again and answers correctly.
17. Backend resolves the question and continues.
18. Student completes the set.
19. If the required streak is strong enough, backend advances the student to Level 2.
20. If not, backend keeps the student at Level 1 for reinforcement.
21. Student clicks Continue.
22. Backend gives a fresh set without repeating used questions.
23. Student stops when they want a break.
24. Dashboard later shows Gauss Law as an active topic with the saved checkpoint.

## 23. Product quality expectation

The final product should feel professional and trustworthy.

The experience should be:

- Clear: the student knows what to do next.
- Smooth: loading states and transitions do not feel broken.
- Adaptive: the system changes based on evidence.
- Honest: no fake frontend data.
- Secure: backend owns scoring, state, and secrets.
- Continuous: practice keeps going until the student stops.
- Supportive: the tutor helps exactly where the student is struggling.

The goal is not just a nice interface. The goal is a working learning platform where the UI, backend, database, AI generation, and adaptive logic all support one clear learning journey.
