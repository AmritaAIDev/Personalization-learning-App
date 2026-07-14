# Topics Module

## Purpose
This module defines the structural curriculum of the learning platform. It maps out the subjects and chapters that the AI engine can generate questions for.

## Key Components
- **topic.entity.ts**: Represents a single learning node (e.g., Subject: "Physics", Name: "Electrostatics").
- **topics.module.ts**: Wraps the entity for injection into the global app module.

## Interaction
The `Topic` entity acts as a primary key reference point. When the `AgentModule` is generating questions, it needs to know which Topic context to retrieve from Qdrant. Additionally, `TestSession` records tie a student directly to a `Topic` to track their mastery.
