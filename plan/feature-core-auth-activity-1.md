---
goal: Implement mock TU login and MySQL-backed activity draft creation
version: 1.0
date_created: 2026-10-13
last_updated: 2026-10-13
owner: Shin-eii
status: 'Completed'
tags: [feature, authentication, activities, express, mysql, react]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Implement GitHub Issue #4 as two traceable vertical slices: mock TU authentication and creation of a free activity draft from the React form into MySQL.

## 1. Requirements & Constraints

- **REQ-001**: A user must select an existing seeded TU member and establish a server-side login session without an application password.
- **REQ-002**: An authenticated member must be able to create a free activity draft through `POST /api/activities`.
- **REQ-003**: The React application must load the current member and send activity data through `/api` instead of local storage for the implemented flow.
- **SEC-001**: The backend must derive `host_member_id` from the authenticated session and must reject a client-supplied host identity.
- **SEC-002**: All database statements must use placeholders and parameter arrays.
- **CON-001**: Real TU SSO, paid activities, locations, publishing, and host participation are outside Issue #4.
- **CON-002**: No database schema change is allowed; implementation must use the approved `members`, `activity_categories`, and `activities` tables.
- **CON-003**: Backend features must follow route → controller → parameterized SQL → table → test traceability.
- **GUD-001**: API errors must use one short JSON shape containing `error.code`, `error.message`, and optional `error.fields`.
- **PAT-001**: Controllers obtain the database pool from `req.app.locals.db`, allowing tests to inject a fake database while production uses `config/db.js`.

## 2. Implementation Steps

### Implementation Phase 1 — Contract and server foundation

- GOAL-001: Define and initialize the Express/MySQL boundary required by both vertical slices.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add the Issue #4 request, response, and error contracts to `docs/api-contract.md`. | ✅ | 2026-10-13 |
| TASK-002 | Add the root backend package scripts and approved dependencies, then implement `config/db.js` and an Express application factory in `app.js`. | ✅ | 2026-10-13 |
| TASK-003 | Add `server.js` to mount the application and close the MySQL pool on shutdown. | ✅ | 2026-10-13 |
| TASK-004 | Add `sql/seed.sql` containing mock TU members and activity categories with repeatable inserts. | ✅ | 2026-10-13 |

### Implementation Phase 2 — Mock authentication jigsaw

- GOAL-002: Implement session-based development login backed by the `members` table.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Implement `routes/auth.routes.js`, `controllers/auth.controller.js`, and `middleware/requireAuth.js` for mock login, logout, and current-member loading. | ✅ | 2026-10-13 |
| TASK-006 | Implement React authentication state, protected navigation, and the design-derived splash, mock-login, and identity-confirmation screens. | ✅ | 2026-10-13 |
| TASK-007 | Add `tests/auth.test.js` for valid login, unknown member, current member, logout, and unauthenticated access. | ✅ | 2026-10-13 |

### Implementation Phase 3 — Activity creation jigsaw

- GOAL-003: Save a validated free activity draft for the authenticated host.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Implement `routes/activities.routes.js` and `controllers/activities.controller.js` with `createActivity` and explicit parameterized INSERT SQL. | ✅ | 2026-10-13 |
| TASK-009 | Add the required description field and connect `NewActivity.jsx` to the API while preserving its design and client-side validation. | ✅ | 2026-10-13 |
| TASK-010 | Add `tests/activities.test.js` for success, unauthenticated access, invalid fields, unknown category, paid-input rejection, and server-derived host identity. | ✅ | 2026-10-13 |

### Implementation Phase 4 — Verification and handoff

- GOAL-004: Verify Issue #4 and document the jigsaw path for review.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-011 | Run backend tests, frontend build, and a schema/seed syntax review; record results in the completion summary. | ✅ | 2026-10-13 |
| TASK-012 | Update `TEAM_STATUS.md` and prepare the Pull Request traceability table without merging or pushing. | ✅ | 2026-10-13 |

## 3. Alternatives

- **ALT-001**: Integrate real TU SSO immediately; rejected because client credentials and callback configuration are unavailable.
- **ALT-002**: Store a fake member only in React local storage; rejected because it would not test backend authorization or the `members` table.
- **ALT-003**: Implement paid activity creation in this Issue; rejected to keep cost calculations and payment authorization in their separately approved module.

## 4. Dependencies

- **DEP-001**: `express` for REST endpoints.
- **DEP-002**: `mysql2` for explicit parameterized MySQL queries.
- **DEP-003**: `express-session` for server-side development login sessions.
- **DEP-004**: `dotenv` for local database and session configuration without committing secrets.
- **DEP-005**: Existing React, React Router, and Vite packages from Pull Request #2.

## 5. Files

- **FILE-001**: `package.json`, backend dependency lockfile, `app.js`, and `server.js`.
- **FILE-002**: `config/db.js` and `.env.example`.
- **FILE-003**: `routes/auth.routes.js`, `controllers/auth.controller.js`, and `middleware/requireAuth.js`.
- **FILE-004**: `routes/activities.routes.js` and `controllers/activities.controller.js`.
- **FILE-005**: `sql/seed.sql` and `docs/api-contract.md`.
- **FILE-006**: `tests/auth.test.js`, `tests/activities.test.js`, and shared test helpers.
- **FILE-007**: React authentication/API modules, authentication pages, `App.jsx`, `NewActivity.jsx`, and Vite proxy configuration.
- **FILE-008**: `TEAM_STATUS.md`.

## 6. Testing

- **TEST-001**: Authentication tests prove that only seeded members can establish a session and that logout invalidates it.
- **TEST-002**: Authorization tests prove that unauthenticated activity creation returns HTTP 401.
- **TEST-003**: Activity validation tests cover required text, category, schedule, deadline, capacity, and the free-only Issue scope.
- **TEST-004**: SQL assertions prove that the host comes from the session and all values are passed separately from the SQL string.
- **TEST-005**: `npm test` passes for the backend and `npm run build` passes inside `frontend/`.

## 7. Risks & Assumptions

- **RISK-001**: The MySQL server may not be configured locally; automated controller tests will use a fake database while the handoff identifies the manual import command.
- **RISK-002**: The frontend branch is not yet merged into `main`; this branch intentionally starts from Pull Request #2 and must be merged after or together with it.
- **ASSUMPTION-001**: Mock authentication is acceptable for development and demonstration until TU SSO access is granted.
- **ASSUMPTION-002**: Issue #4 creates activity records only with status `DRAFT`; location and publishing follow in another Issue.

## 8. Related Specifications / Further Reading

- GitHub Issue #4: `https://github.com/Shin-eii/TU_Squad_Up/issues/4`
- `AGENTS.md`
- `DECISIONS.md` (`DEC-003`)
- `outputs/TU_Squad_Up_System_Design_Brain_Dump.md`
- `sql/schema.sql`
