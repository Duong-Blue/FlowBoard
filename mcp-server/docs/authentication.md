# Phase 2 Authentication Contract

## Credential Source
- Token source: Environment variable `FLOWBOARD_API_TOKEN`.

## Auth Flow
- Client + AuthContext construct the request.
- Context validation: Calls `/users/me` on startup/initialization to verify the token.

## Expiry & Error Handling
- Token expiry: 15 minutes.
- Error behavior: 401/403 responses result in safe failure (task aborted/rejected).
- Auto-refresh: None.

## Security Boundaries
- Agent identity: The agent cannot override or impersonate user identity. It inherits the identity bound to `FLOWBOARD_API_TOKEN`.
