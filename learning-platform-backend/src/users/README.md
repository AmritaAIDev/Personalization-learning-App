# Users Module

## Purpose
This module handles the core student identity and authentication storage in the system. It is responsible for defining what a user is within the database.

## Key Components
- **user.entity.ts**: The TypeORM entity mapping the `users` table. Contains fields for UUID, email, hashed password, and user role.
- **users.module.ts**: Wraps the entity for dependency injection into the global `app.module.ts`.

## Interaction
The User entity is referenced via Foreign Keys (Many-to-One) by the `TestSession` entity in the `SessionsModule`. It will eventually be injected into an `AuthModule` to validate login credentials provided by the Next.js frontend.
