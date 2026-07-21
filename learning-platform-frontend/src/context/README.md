# Client state boundaries

- `AuthContext` restores and manages the opaque HttpOnly browser session through `/api/auth/*`. It never stores a token in browser storage.
- `JourneyContext` loads the authenticated learner journey only after a session is available.

Diagnostic attempts, timing, scoring, recommendations, and history are deliberately fetched directly from the secured diagnostics API rather than cached as authoritative client state.
