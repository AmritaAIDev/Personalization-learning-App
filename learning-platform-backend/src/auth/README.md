# Authentication module

Opaque, random session tokens in `HttpOnly` cookies; only a SHA-256 token hash is stored in PostgreSQL. Passwords are bcrypt-hashed. CORS/CSRF accept only exact `FRONTEND_ORIGIN` values — no hostname-pattern matching, so preview deployments must be added explicitly.

No password, session token, or external credential is ever returned in a response body.

## API

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | create an account |
| POST | `/api/auth/login` | start a session |
| POST | `/api/auth/logout` | revoke the current session |
| GET | `/api/auth/me` | current authenticated user |
