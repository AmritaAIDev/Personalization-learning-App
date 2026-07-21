# Learning Experience Specification

This document explains how the learning experience should work from a product point of view. It is written in plain language so the flow, rules, and learner journey are easy to understand without technical detail.

## 1. Purpose of the Product

This platform is not just a place where students answer questions. Its real purpose is to understand how strong or weak a student is in a topic, identify where they are getting stuck, and help them improve step by step.

The platform should feel like a guided learning system, not a random quiz app.

It should answer questions like:

- What level is this student currently at in this topic?
- Are they weak in memory, understanding, application, or deeper reasoning?
- Are they making basic mistakes or struggling only at advanced difficulty?
- What should they study next?
- What is the right next question for them?

## 2. Core Learning Idea

Every topic is treated as a learning ladder with 15 stages.

These 15 stages are created by combining:

- 5 thinking levels
- 3 difficulty levels

The 5 thinking levels are:

1. Remember
2. Understand
3. Apply
4. Analyze
5. Evaluate

The 3 difficulty levels are:

1. Easy
2. Medium
3. Hard

This creates the full path:

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

This means a student does not jump straight from easy to hard randomly. They move in a meaningful path.

## 3. What a “Level” Means

A user’s level in a topic means their current position in this 15-stage path.

For example:

- If a student is at `Understand - Easy`, it means they can recall basics and are now being checked on whether they actually understand the concept.
- If a student is at `Apply - Medium`, it means they can already handle lower levels and are now expected to solve standard problems with moderate challenge.
- If a student is at `Evaluate - Hard`, it means they are operating at a very advanced stage in that topic.

So the level is not just “easy, medium, hard.” It is a combination of:

- how deeply the student understands the topic
- how difficult the question is

## 4. How a Student Starts in a Topic

When a student chooses a topic for the first time, the system should begin from the safest baseline unless there is enough prior evidence to place them higher.

The default starting point is:

- Remember - Easy

This is the foundation check. It answers:

- Does the student know the basic formula?
- Do they recognize the main idea?
- Can they identify the most important concept?

If the student is already strong, they will move up quickly.

If they are weak, the platform catches it early instead of pushing them into questions that are too difficult.

## 5. How Progression Works

At every stage, the student gets a small set of questions from that exact stage.

The goal is not to flood the student with too many questions. The goal is to confirm mastery clearly.

The current working rule is:

- each stage is checked with a set of 5 questions

If the student answers all 5 correctly in that stage, the stage is considered cleared, and the student moves to the next stage.

That means:

- clear `Remember - Easy` -> move to `Understand - Easy`
- clear `Evaluate - Easy` -> move to `Remember - Medium`
- clear `Evaluate - Medium` -> move to `Remember - Hard`

The system should feel like a guided climb.

## 6. What Happens When the Student Gets a Question Wrong

A wrong answer should not immediately feel like failure. It should be treated as a learning moment.

The intended flow is:

1. The student gives an answer.
2. If it is wrong, the platform does not immediately dump the final answer.
3. First, it gives a helpful hint or guided explanation.
4. The student gets another chance to think again.

This is important because sometimes a student knows the concept but made a careless step.

If the student still gets it wrong after support, then the system should treat it as a real sign that the current stage is too difficult or not yet stable.

At that point:

- the stage is not cleared
- the system may move the student down by one stage
- the platform explains the correct logic clearly

This prevents fake progress.

## 7. How a Student Moves Down

If a student repeatedly fails at the current stage, the system should lower the level carefully rather than collapsing the whole journey.

Examples:

- If a student fails `Analyze - Medium`, they may move back to `Apply - Medium`
- If a student fails `Remember - Medium`, they may move to `Evaluate - Easy`

This rule matters because the platform should not assume the student knows everything before the current stage.

Moving down allows the system to rebuild confidence and understanding at the right point.

## 8. The Absolute Foundation Rule

If a student struggles even at the lowest stage of a topic, that means the issue may not be inside that topic alone.

For example:

- a student may struggle in Electrostatics because they never truly understood basic force concepts
- a student may struggle in Calculus because prerequisite algebra is weak

In such cases, the platform should be able to redirect the student to a more basic prerequisite topic instead of forcing them to continue failing.

This makes the platform diagnostic, not just reactive.

## 9. How Questions Should Be Designed

Questions should not be random.

Every question must belong to:

- one topic
- one thinking level
- one difficulty level

Each question should be built with a clear reason for being there.

For example:

- `Remember` questions check recall
- `Understand` questions check whether the student can explain or interpret
- `Apply` questions check standard use of formulas or methods
- `Analyze` questions check multi-step reasoning or comparison
- `Evaluate` questions check judgment, method selection, or reasoning quality

This gives the platform structure and avoids mixing very different question types together.

## 10. Are Questions Added Manually or Automatically?

The best product model is a combination of both.

### Manually prepared questions

These are the trusted base of the system.

They should be:

- reviewed carefully
- aligned to the topic
- aligned to the correct stage
- written in the style expected for the student audience
- checked for clarity and correctness

This is the core question bank and should always exist first.

### AI-generated questions

AI-generated questions are useful as an expansion layer.

They should help when:

- a stage does not have enough questions
- the student has already seen too many repeated questions
- the system needs fresh practice at a specific level

But the product rule should be clear:

- manual questions are the trusted foundation
- AI questions are used to expand, personalize, and reduce repetition

The learner should feel that question quality stays consistent.

## 11. How the Question Supply Should Work

For every topic and stage, the system should try to maintain a healthy pool of questions.

That means:

- enough questions for first-time learning
- enough backup questions for repeat practice
- enough variation so the student is not memorizing answer patterns

If the pool becomes too small, the system should prepare more questions in advance rather than waiting until the student is blocked.

This keeps the experience smooth and avoids delays.

## 12. What “Curriculum” Means in This Product

In this platform, curriculum is not just a chapter list.

Curriculum means three things working together:

1. Topic order
2. Prerequisite relationships
3. Internal mastery path inside each topic

So a topic is not just “open and close.”

Each topic has:

- an entry point
- an internal 15-stage path
- links to previous foundation topics
- links to likely next topics

This makes the system feel like a guided map instead of disconnected practice screens.

## 13. How Search Should Fit Into Learning

Search is not only a navigation feature. It is a learning entry point.

When a student searches a topic:

- the platform should understand what topic they want
- show whether it is new, active, or already completed
- allow them to begin or resume their learning journey there
- show suggested related topics where useful

Search should help the user start learning quickly, without confusion.

## 14. What the Dashboard Should Communicate

The dashboard should help the student answer:

- What am I learning now?
- What have I completed?
- What should I do next?
- Where am I weak?
- Which topics are recommended for me?

A strong dashboard should show:

- active topics
- recently completed topics
- suggested next topics
- progress stage in each active topic
- learning history

The dashboard should feel like a personal learning control center.

## 15. What the Main Learning Session Should Feel Like

The learning session should feel focused and calm.

A student should clearly understand:

- which topic they are in
- what kind of question they are answering
- where they are in the current stage
- whether they are progressing
- what to do after a wrong answer

The session should avoid clutter and should keep the student’s attention on:

- the question
- the response
- the guidance
- the next step

## 16. How the Tutor or Chat Support Should Behave

The support assistant should behave like a smart learning guide, not like an answer machine.

Its job is to:

- nudge the student when they are close
- explain misconceptions clearly
- compare the student’s thinking with the correct reasoning
- help them recover after mistakes
- make learning feel supported, not judged

It should especially help when:

- the student gets a question wrong
- the student asks “why is this wrong?”
- the student wants a simpler explanation
- the student wants concept clarification

The assistant should strengthen learning, not bypass it.

## 17. How Flashcards Fit Into the Product

Flashcards are not the main engine. They are a support layer.

They help with:

- formulas
- definitions
- quick recall
- common patterns
- memory reinforcement

Flashcards should connect to the topics the student is actively learning.

They are especially useful for:

- revision after a learning session
- weak memory areas
- spaced repetition

So the product has two modes working together:

- deep learning through question flow
- fast reinforcement through flashcards

## 18. How Completion Should Be Defined

A topic should not be marked complete just because the student opened it or answered a few questions.

Completion should mean the student has successfully cleared the full intended journey for that topic, or at least the target mastery range defined by the product.

A stronger model is:

- stage completion for short-term progress
- topic mastery for long-term completion

This prevents misleading progress indicators.

## 19. How Suggested Topics Should Work

Suggested topics should come from learning logic, not generic recommendations.

They should be based on things like:

- what the student is currently studying
- what they recently completed
- which prerequisite is weak
- which next topic naturally follows
- where the student has gaps

This makes the platform feel intelligent and personal.

## 20. What Makes This Product Different from a Normal Quiz App

This platform is different because it:

- tracks where the student really is in a topic
- moves them forward only after clear proof
- supports them after mistakes
- redirects them if foundations are weak
- mixes guided practice with recall tools
- uses fresh question generation when needed
- builds a long-term learning path instead of isolated tests

This is why the product should be positioned as an adaptive learning platform, not just a question bank.

## 21. Recommended Product Rules to Keep Stable

These rules should stay consistent across the experience:

1. Every question belongs to a defined topic, thinking level, and difficulty.
2. Every student has a current stage per active topic.
3. A student must earn progression; it should not be random.
4. Wrong answers should trigger support before punishment.
5. Repeated failure should lower the stage to the right point.
6. Weak foundations should redirect the student to prerequisite learning when needed.
7. Questions should come from a trusted base pool, with AI helping expand supply.
8. Flashcards should support recall, not replace core learning.
9. Search, dashboard, and history should all reinforce the learning journey.
10. The whole product should feel like one guided system, not separate disconnected tools.

## 22. Simplified End-to-End Learner Journey

Here is the full product flow in simple terms:

1. The student logs in.
2. The dashboard shows active topics, history, and suggested next steps.
3. The student searches or chooses a topic.
4. The system checks where the student currently stands in that topic.
5. The student starts at the correct stage.
6. The student answers a small set of questions from that stage.
7. Correct performance moves them upward.
8. A wrong answer triggers guided support.
9. Repeated struggle moves them downward or toward a prerequisite.
10. Flashcards strengthen memory alongside question practice.
11. The dashboard updates the student’s progress and recommends what to do next.

## 23. Final Product Intent

The final goal of the platform is not only to measure performance.

The goal is to build a system that can:

- detect current ability accurately
- guide the student to the right next challenge
- correct weak understanding early
- maintain momentum
- reduce random practice
- create a clear feeling of progression

In short:

The product should feel like a disciplined personal coach for JEE preparation.
