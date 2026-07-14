# Core Domain Logic & Principles

This file serves as a reference guide for all AI Agents working on the JEE Competency Diagnosis and Adaptive Learning Assistant. Before building any backend logic, scoring algorithm, or question schema, refer to the principles below.

## 1. The Core Identity
This platform is NOT just a testing app. It is a **diagnostic tool**. The goal is not merely to give a student a score, but to identify the exact root cause of their weakness (e.g., "Calculation Error" vs "Concept Gap" vs "Formula Confusion") and provide highly targeted learning recommendations.

## 2. Question Tagging (The 2 Dimensions)
Every question in the database MUST be tagged using two dimensions:

### A. Bloom's Taxonomy Level
This measures the cognitive depth required to solve the question.
- **Remember:** Recall formula, definition, fact.
- **Understand:** Explain concept, identify relation.
- **Apply:** Use formula in a standard problem.
- **Analyze:** Multi-step problem, compare methods, break into parts.
- **Evaluate:** Decide best method, identify incorrect reasoning, judge assumptions.
*(Note: "Create" is excluded for JEE diagnostic testing).*

### B. Hardness Level
This measures the inherent difficulty of the problem.
- **Easy:** Direct formula or basic concept.
- **Medium:** Standard JEE-level application.
- **Hard:** Multi-step, mixed concepts, high reasoning.
- **Very Hard:** Advanced JEE / Olympiad-like.

## 3. The Competency Scoring Engine
The backend `CompetencyModule` must calculate a student's topic competency (0 to 100) using the following weighted formula:

**Topic Competency Score =**
- `0.45 × Accuracy Score` (How many answered correctly)
- `+ 0.20 × Difficulty Score` (Ability to solve Medium/Hard questions)
- `+ 0.20 × Bloom Score` (Ability to answer Analyze/Evaluate questions)
- `+ 0.10 × Speed Score` (Solving within expected `estimated_time_sec`)
- `+ 0.05 × Consistency Score` (Stable performance across multiple attempts)

### Competency Interpretation:
- **0–30 (Beginner):** Lacks basic understanding.
- **31–50 (Developing):** Knows some ideas but cannot apply reliably.
- **51–70 (Intermediate):** Can solve standard problems but struggles with hard ones.
- **71–85 (Proficient):** JEE-ready for this topic.
- **86–100 (Advanced):** Can handle difficult, multi-concept problems.

## 4. The AI Chatbot (Socratic Tutor)
The chatbot should never just give the answer. Its logic should:
1. Explain concepts in simple language.
2. Ask small follow-up questions to test understanding.
3. Identify the core misconception (e.g., "You are struggling with the direction of friction, not the formula").
4. Escalate to a live tutor if the student repeatedly fails or if their competency remains below 40 after intervention.

## Agent Instructions:
When you are asked to build the `CompetencyService` or the `QuestionEntity`, you MUST refer to this file to ensure you include fields for `bloom_level`, `difficulty`, and implement the formula exactly as written above.
