# Users Module

## Purpose
This module handles the core student identity, authentication storage, and role-based access control in the system. It is responsible for defining what a user is within the database and for managing administrator roles.

## Key Components
- **user.entity.ts**: The TypeORM entity mapping the `users` table. Contains fields for UUID, email, hashed password, and user role.
- **users.module.ts**: Wraps the entity for dependency injection into the global `app.module.ts`.
- **users.service.ts**: Provides data access for user lookup, listing, and role updates. Enforces role validation and prevents administrators from demoting their own role.
- **users.controller.ts**: Exposes REST endpoints for the current user, admin-only user directory listing, and admin-only role updates.

## API Endpoints
- `GET /api/users/me` — returns the current authenticated user.
- `GET /api/users` — **admin only** — lists all users ordered by newest first.
- `PATCH /api/users/:userId/role` — **admin only** — promotes or demotes a user. An admin cannot demote their own administrator role.

## Interaction
The User entity is referenced via Foreign Keys (Many-to-One) by the `TestSession` entity in the `SessionsModule`. The `AuthModule` validates login credentials provided by the Next.js frontend, and the `RolesGuard` enforces admin-only access on protected endpoints.
