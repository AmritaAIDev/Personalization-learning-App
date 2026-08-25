# Users module

Student identity, credential storage, and role-based access control. `UsersService` enforces role validation and blocks an admin from demoting their own role.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/users/me` | current authenticated user |
| GET | `/api/users` | list all users — **admin only** |
| PATCH | `/api/users/:userId/role` | promote/demote a user — **admin only** |
