# System Specifications: JEE Adaptive Learning Engine

This document defines the engineering specifications for the JEE Personalized Learning Platform. It serves as the master blueprint for the core assessment mechanics, database state management, and knowledge graph routing.

## 1. System Entry & Session Initialization

**Sequence:**
1. **State Retrieval**: Upon user authentication, the backend queries the database for the `User_Mastery_State` JSON object. This object tracks the user's progress on all topics, including their current `(Taxonomy, Difficulty)` coordinates.
2. **Dashboard Rendering**: The client populates the Command Center interface.
3. **Predictive Routing**:
   - The backend retrieves the array of the last 3 active topics.
   - A proximity algorithm (Cosine Similarity) is executed across the Knowledge Graph's vector space to identify related prerequisites or next steps.
   - The system returns 3 mathematically determined "Suggested Next Topics" to the frontend.
4. **Node Selection**: The user selects a target node (e.g., *Calculus Limits*) to initiate the assessment loop.

---

## 2. Orthogonal State-Space Matrix (The $T \times D$ Grid)

The system abandons linear learning paths in favor of an orthogonal 2D coordinate space $(T, D)$.

### 2.1 The Cognitive Depth Axis ($T$)
Based on the Revised Bloom's Taxonomy, defining the cognitive load required:
- **$T_1$ (Remember)**: Fact and formula retrieval.
- **$T_2$ (Understand)**: Comprehending conceptual frameworks and variable relationships.
- **$T_3$ (Apply)**: Algorithmic execution in standard parameters.
- **$T_4$ (Analyze)**: Deconstruction of multi-variable problems.
- **$T_5$ (Evaluate)**: Appraisal of boundary conditions and mathematical proofs.

### 2.2 The Inherent Complexity Axis ($D$)
Defining the structural and computational difficulty of the problem:
- **$D_1$**: Easy
- **$D_2$**: Medium
- **$D_3$**: Hard

**Architecture Visualization:**
![Algorithmic Routing Flow](C:/Users/lokes/.gemini/antigravity/brain/88e985f5-b0b6-4b4b-8f4b-274e47ef02ab/algorithmic_routing_flow_5_levels_1784276922825.png)

---

## 3. Algorithmic State Transitions and Mastery Routing

### 3.1 Node Initialization and the Queue
- **Baseline Rule:** If the target topic is completely new to the user, the database initiates their state at the absolute baseline coordinate: `current_node: (T1, D1)`.
- **The Cache:** The backend fetches exactly **5 questions** tagged with `(T1, D1)` from the database and loads them into a temporary session cache to minimize database reads during the assessment.
- **Streak Tracker:** A session variable `streak_counter` is initialized to `0`.

### 3.2 Positive State Transition (Advancement)
Upon the user submitting a correct answer:
1. **Database Update:** The backend increments the `streak_counter` by `+1`.
2. **Evaluation:**
   - **If `streak_counter < 5`:** The system serves the next question from the session cache.
   - **If `streak_counter == 5`:** The node is considered saturated (cleared).
3. **State Transition:** 
   - The backend commits a permanent database update, changing the user's `current_node` to the next coordinate.
   - **Priority:** Cognitive depth ($T$) is prioritized over difficulty ($D$). Thus, the database state updates from `(T1, D1)` to `(T2, D1)`.
   - Once all cognitive levels at a difficulty tier are cleared (e.g., reaching `(T5, D1)`), the next transition loops the difficulty axis, updating the state to `(T1, D2)`.
   - The cache flushes, and 5 new questions for the new coordinate are fetched.

### 3.3 Negative State Transition (Demotion & Scaffolding)
Upon the user submitting an incorrect answer:
1. **Asynchronous Pause:** The assessment loop halts. The backend flags the session and deliberately hides the correct answer from the client.
2. **Socratic Intervention:** The backend passes the question data and the user's specific erroneous input to the LLM agent. The LLM generates a localized Socratic hint to trigger self-correction, which is served to the client.
3. **Secondary Evaluation:** The user attempts the identical question again.
4. **Demotion Trigger:** If the secondary attempt fails:
   - **Database Update:** The backend hard-resets the `streak_counter` back to `0`.
   - **State Transition:** The backend executes a demotion update on the `current_node`.
   - Intra-Difficulty Demotion: State changes from `(T3, D2)` backwards to `(T2, D2)`.
   - Inter-Difficulty Demotion (Floor case): State changes from `(T1, D2)` down to `(T5, D1)`.
   - The cache flushes, and 5 new questions for the lower coordinate are loaded.

### 3.4 Directed Acyclic Graph (DAG) Prerequisite Traversal
- **The Absolute Floor Boundary:** If a user is at the baseline state `(T1, D1)` and fails the secondary Socratic attempt, a critical event is triggered in the backend.
- **Graph Traversal:** The backend queries the Knowledge Graph database for the direct prerequisite node of the current topic.
- **Forced Routing:** The user's session is forcibly redirected. Their state for the original topic is paused, and a new assessment loop initiates at the `(T1, D1)` coordinate of the prerequisite topic.

### 3.5 Generative Corpus Augmentation (AI Agent)
- **Trigger:** When the backend attempts to load 5 questions into the cache for coordinate `(T_x, D_y)`, but the database returns `< 5` available questions.
- **Execution:** A Generative AI background worker is triggered. It uses the `(T_x, D_y)` tags as rigid prompt parameters to synthesize missing questions in real-time. These are inserted into the database and immediately pulled into the user's cache, ensuring zero interruption to the assessment flow.

---

## 4. Administrative & Version Control Standards
To preserve architectural integrity across the engineering team:
1. **Synchronous Documentation:** Comprehensive minutes for all project alignments must be logged in the centralized Google Drive repository.
2. **Decentralized Review (POV Drafting):** Direct manipulation of this master specification document is prohibited. Team members must fork the documentation into isolated "Review Drafts" to propose algorithmic modifications or alternative Points of View (POV).
