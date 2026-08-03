# Authentication module

This module owns browser authentication for the learning platform. It uses opaque, random
session tokens in `HttpOnly` cookies and stores only a SHA-256 token hash in PostgreSQL.

## Responsibilities

- Register and authenticate students with bcrypt password hashes.
- Create, revoke, and expire database-backed sessions.
- Attach the authenticated user to protected Nest requests.
- Enforce role checks, throttling, and origin validation for unsafe browser requests.
- Allow only the exact `FRONTEND_ORIGIN` values for CORS and CSRF checks; preview
  deployments must be added explicitly rather than accepted by a hostname pattern.

No password, session token, or external credential is returned in API response bodies.
