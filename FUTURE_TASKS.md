# Future Planned Tasks & Advanced Implementations

This document tracks advanced features, optimizations, and technical debt that are planned for future phases of the project. For the current MVP, a basic implementation (e.g., normal storing and vectorization) is sufficient, but we will transition to these strategies as the platform scales.

## 1. Advanced RAG (Retrieval-Augmented Generation) Pipeline
While basic vector storing is enough for the prototype, the following strategies must be implemented for the production chatbot to ensure high physics accuracy.

### A. Structural & Concept-Based Chunking
- **Semantic Boundaries:** Transition from fixed-size token chunking to concept-based boundaries (e.g., keeping an entire physics theorem or a full solved example in one chunk).
- **Formula Preservation:** Ensure LaTeX/MathML formulas are never split across chunks.
- **Parent-Child Chunking:** Embed small, dense chunks for search (e.g., definition of Gauss Law), but retrieve the larger "Parent Chunk" (definition + examples + mistakes) for the LLM context window.

### B. Hybrid Storing Strategy in Qdrant
- **Separate Collections:** Maintain strict separation between `jee_questions` (for practice recommendation) and `learning_concepts` (for chatbot teaching).
- **Rich Payloads:** Store structured metadata (`chapter`, `topic`, `bloom_level_addressed`) in the Qdrant payload to enable Hybrid Search (Vector Search + Exact Metadata Filtering) to prevent cross-chapter hallucination.

### C. Advanced Retrieving (HyDE & Contextual Handoff)
- **HyDE (Hypothetical Document Embeddings):** When a student asks a vague question (e.g., "Why is it zero?"), use a cheap LLM call to generate a hypothetical physics answer first, and vectorize that hypothetical answer to search Qdrant.
- **Context Handoff:** Combine Qdrant's semantic retrieval with PostgreSQL's structured data. Feed the Chatbot the retrieved physics chunks ALONG WITH the student's historical weakness (e.g., "Calculation Errors") from Postgres.

## 2. Platform Scaling & Future Enhancements
*(Additional future tasks will be added here as the project evolves)*
- Implement Chemistry and Mathematics MVPs.
- Add user authentication and JWT session management.
- Build live tutor escalation routing system.
