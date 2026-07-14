# Sessions Module

## Purpose
This module is the core tracking engine for student performance. It bridges the gap between the `User`, the `Topic`, and the AI's generated output.

## Key Components
- **test-session.entity.ts**: Records a student's attempt at mastering a specific topic. Tracks the `currentScore` and `status` (in-progress vs completed).
- **sessions.module.ts**: Wraps the entity for use in the app module.

## Interaction & Database Schema
This entity solves the redundancy problem by strictly defining relations via Foreign Keys (`user_id` and `topic_id`). 
- It uses a `ManyToOne` relationship to the `User` and `Topic` entities.
- **Redundancy Checking:** By separating the `Topic` definition from the `TestSession` attempt, we ensure that the curriculum (Topic name, description) is only defined once, while thousands of TestSessions can cleanly reference that single row without duplicating the curriculum data.
- **OnDelete Cascade:** If a user or a topic is deleted, the cascade behavior guarantees no orphaned session records remain in the database.
