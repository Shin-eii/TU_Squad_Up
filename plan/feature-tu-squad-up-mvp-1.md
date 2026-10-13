---
goal: Deliver a demonstrable TU Squad Up MVP with four contributors in 20 calendar days
version: 1.0
date_created: 2026-10-13
last_updated: 2026-10-13
owner: TU Squad Up four-person development team
status: 'Planned'
tags: [feature, mvp, web-app, mysql, team-roadmap]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan delivers a working TU Squad Up web application between 2026-10-13 and 2026-11-01. The implementation assumption is a React and TypeScript frontend, an Express and TypeScript REST API, and MySQL. If the team selects another stack, preserve the milestones, module ownership, API contracts, and acceptance criteria.

## 1. Requirements & Constraints

- **REQ-001**: A member must be able to sign in through an authentication adapter; development must support seeded mock accounts when TU SSO credentials are unavailable.
- **REQ-002**: A host must be able to create, edit, publish, view, and cancel an activity.
- **REQ-003**: A member must be able to browse activities, inspect details, accept rules, request to join, and withdraw.
- **REQ-004**: A host must be able to approve or reject join requests and record organizer-added guests.
- **REQ-005**: An activity must store one marker, circle, or rectangle location.
- **REQ-006**: A paid activity must support equal-split and individual cost items, participant allocations, cost locking, and manual payment-receipt confirmation.
- **REQ-007**: A host must be able to record attendance and complete the activity.
- **REQ-008**: The final demonstration must show one complete paid-activity lifecycle without manually editing the database.
- **CON-001**: The project has four contributors and 20 calendar days, including testing, documentation, and presentation preparation.
- **CON-002**: Bank payment processing and automatic PromptPay-slip verification are outside the MVP scope.
- **CON-003**: Real TU SSO integration must not block application development or the final demonstration.
- **GUD-001**: Each contributor owns a vertical feature module, including UI, API, database queries, validation, and tests.
- **GUD-002**: Merge small reviewed changes into the shared development branch at least once per working day.
- **GUD-003**: Freeze new feature development after Day 15; Days 16 through 20 are reserved for stabilization and delivery.
- **PAT-001**: Use controller-service-repository separation in the server and feature-based folders in the client.
- **SEC-001**: Enforce authorization on the server; client-side hidden buttons are not an authorization mechanism.

## 2. Implementation Steps

### Implementation Phase 1 — Agreement and Foundation, Days 1–2 (October 13–14)

- GOAL-001: Establish one runnable project, one database schema, and stable contracts before parallel development begins.

| Task | Description | Owner | Dependencies | Completed | Date |
|------|-------------|-------|--------------|-----------|------|
| TASK-001 | Create `app/client`, `app/server`, and `app/database`; add root setup commands and `.env.example`; verify both applications start locally. | Person 1 | None | | |
| TASK-002 | Place the approved schema in `app/database/schema.sql`, create `app/database/seed.sql` with four mock members and sample categories, and verify a clean MySQL import. | Persons 1 and 4 | None | | |
| TASK-003 | Define request and response payloads in `app/docs/api-contract.md`, including error format, authentication identity, activity status, participation status, and payment status. | All | TASK-002 | | |
| TASK-004 | Create the shared page wireframe and route list in `app/docs/screen-contract.md`; define login, activity list, activity detail, create/edit activity, host dashboard, costs, and attendance screens. | All | None | | |
| TASK-005 | Configure branch protection, pull-request review, linting, formatting, and automated test commands; record the workflow in `app/CONTRIBUTING.md`. | Person 1 | TASK-001 | | |

### Implementation Phase 2 — Core Vertical Slices, Days 3–7 (October 15–19)

- GOAL-002: Complete the minimum end-to-end flow from login through approved participation.

| Task | Description | Owner | Dependencies | Completed | Date |
|------|-------------|-------|--------------|-----------|------|
| TASK-006 | Implement mock authentication, current-member loading, role middleware, member profile, and navigation shell in `app/server/src/modules/auth`, `app/server/src/modules/members`, and `app/client/src/features/auth`. | Person 1 | TASK-001, TASK-002, TASK-003 | | |
| TASK-007 | Implement activity category listing and activity create, edit, publish, cancel, list, filter, and detail operations in `app/server/src/modules/activities` and `app/client/src/features/activities`. | Person 2 | TASK-001, TASK-002, TASK-003, TASK-004 | | |
| TASK-008 | Implement activity rules, rule acceptance, join request, approval, rejection, withdrawal, participant list, capacity checks, and guest creation in `app/server/src/modules/participations`, `app/server/src/modules/rules`, and matching client features. | Person 3 | TASK-006, TASK-007 | | |
| TASK-009 | Implement reusable MySQL transaction helpers, activity-cost query foundations, and database integration-test reset scripts in `app/server/src/database` and `app/server/test/helpers`. | Person 4 | TASK-001, TASK-002 | | |
| TASK-010 | Demonstrate the first milestone: mock login, create and publish a free activity, request to join, approve the request, and display the confirmed participant. | All | TASK-006, TASK-007, TASK-008, TASK-009 | | |

### Implementation Phase 3 — Location, Costs, and Completion, Days 8–12 (October 20–24)

- GOAL-003: Complete the full paid-activity lifecycle and map location workflow.

| Task | Description | Owner | Dependencies | Completed | Date |
|------|-------------|-------|--------------|-----------|------|
| TASK-011 | Add account settings, PromptPay identifier management, in-app notification records, and a notification list/read state. | Person 1 | TASK-006 | | |
| TASK-012 | Add the map component and activity-location API supporting marker, circle, and rectangle coordinates in `app/client/src/features/map` and `app/server/src/modules/locations`. | Person 2 | TASK-007 | | |
| TASK-013 | Add invitation handling, late-join approval after cost lock, withdrawal-after-lock liability, attendance status fields, and join-flow notification triggers. | Person 3 | TASK-008, TASK-011 | | |
| TASK-014 | Implement cost items, equal and individual allocations, cost locking, participant amount owed, receipt upload metadata, and host confirmation or rejection in `app/server/src/modules/costs`, `app/server/src/modules/payments`, and matching client features. | Person 4 | TASK-009, TASK-010 | | |
| TASK-015 | Implement start, attendance recording, completion, status history, volunteer badge awarding, and reliability calculation from participation records. | Persons 3 and 4 | TASK-013, TASK-014 | | |
| TASK-016 | Demonstrate the second milestone: create a mapped paid activity, approve members and a guest, split costs, lock participants, submit and confirm a receipt, record attendance, and complete the activity. | All | TASK-011, TASK-012, TASK-013, TASK-014, TASK-015 | | |

### Implementation Phase 4 — Integration and Feature Freeze, Days 13–15 (October 25–27)

- GOAL-004: Merge every required module and stop adding new features after the integrated acceptance test passes.

| Task | Description | Owner | Dependencies | Completed | Date |
|------|-------------|-------|--------------|-----------|------|
| TASK-017 | Merge all modules into the shared development branch, resolve contract mismatches, and verify a fresh clone can start using only the documented setup commands. | Person 1 | TASK-016 | | |
| TASK-018 | Add empty, loading, validation, authorization-denied, activity-full, deadline-passed, and server-error states to all owned screens. | All, by module | TASK-017 | | |
| TASK-019 | Add database constraints and server checks for capacity, duplicate participation, host-only actions, invalid status transitions, locked-cost modification, and payment overconfirmation. | Persons 2, 3, and 4 | TASK-017 | | |
| TASK-020 | Run the complete demonstration acceptance test with two browsers or sessions and record every defect in `app/docs/defects.md`; declare feature freeze when no blocking defect remains. | All | TASK-018, TASK-019 | | |

### Implementation Phase 5 — Stabilization, Documentation, and Delivery, Days 16–20 (October 28–November 1)

- GOAL-005: Deliver a stable application, reproducible database, report evidence, and rehearsed demonstration.

| Task | Description | Owner | Dependencies | Completed | Date |
|------|-------------|-------|--------------|-----------|------|
| TASK-021 | Fix blocking and high-severity defects; do not add features. Re-run affected integration tests after every fix. | All, Days 16–17 | TASK-020 | | |
| TASK-022 | Execute authorization, validation, concurrency, status-transition, cost-rounding, and withdrawal-after-lock test cases; save results in `app/docs/test-report.md`. | Persons 3 and 4, Day 17 | TASK-020 | | |
| TASK-023 | Polish responsive layout, terminology, map controls, form guidance, loading states, and confirmation messages without changing database behavior. | Persons 1 and 2, Days 17–18 | TASK-020 | | |
| TASK-024 | Finalize `app/README.md`, setup instructions, ER diagram, API summary, schema explanation, test evidence, screenshots, known limitations, and contribution record. | All, Day 18 | TASK-021, TASK-022, TASK-023 | | |
| TASK-025 | Prepare a deterministic five-minute demonstration dataset and script in `app/docs/demo-script.md`; assign speaking sections and rehearse twice. | All, Day 19 | TASK-024 | | |
| TASK-026 | Create the final release tag, export the final schema and seed data, verify the release on a clean machine, and reserve remaining time for emergency fixes only. | All, Day 20 | TASK-025 | | |

## 3. Alternatives

- **ALT-001**: Divide the team into frontend, backend, database, and UI roles. Rejected because it creates handoff bottlenecks and leaves each feature dependent on all four contributors.
- **ALT-002**: Implement every proposed feature before integration. Rejected because a 20-day schedule requires a working core flow by Day 7 and feature freeze by Day 15.
- **ALT-003**: Require live TU SSO and automated PromptPay verification for the MVP. Rejected because external access and verification accuracy could block the final demonstration.

## 4. Dependencies

- **DEP-001**: Node.js LTS and npm available on each contributor's development machine.
- **DEP-002**: MySQL 8.x available locally or through one agreed shared development server.
- **DEP-003**: React, TypeScript, and Vite for `app/client`.
- **DEP-004**: Express and TypeScript for `app/server`.
- **DEP-005**: A browser map library and map tile provider that allow marker, circle, and rectangle rendering.
- **DEP-006**: Shared Git repository with pull-request review access for all four contributors.

## 5. Files

- **FILE-001**: `app/client/` — React frontend organized by feature.
- **FILE-002**: `app/server/` — Express REST API organized by module.
- **FILE-003**: `app/database/schema.sql` — authoritative MySQL schema.
- **FILE-004**: `app/database/seed.sql` — deterministic demonstration data.
- **FILE-005**: `app/docs/api-contract.md` — endpoint and payload contract.
- **FILE-006**: `app/docs/screen-contract.md` — route and UI-state contract.
- **FILE-007**: `app/docs/test-report.md` — final verification evidence.
- **FILE-008**: `app/docs/demo-script.md` — final demonstration sequence and speaking assignments.
- **FILE-009**: `app/README.md` — installation, configuration, migration, seed, test, and run instructions.

## 6. Testing

- **TEST-001**: Verify a host can create, publish, edit, view, and cancel an activity while a non-host cannot modify it.
- **TEST-002**: Verify join request, approval, rejection, withdrawal, invitation, guest, capacity, and deadline behavior.
- **TEST-003**: Verify marker, circle, and rectangle locations save and reload with the same coordinates.
- **TEST-004**: Verify equal splits preserve the cost-item total after decimal rounding and individual costs affect only their assigned participants.
- **TEST-005**: Verify withdrawal after cost lock keeps the original allocation unless the host explicitly waives it.
- **TEST-006**: Verify receipt submission never marks a payment confirmed until the host confirms it.
- **TEST-007**: Verify only valid activity status transitions are accepted and every change creates status history.
- **TEST-008**: Verify attendance, volunteer badge, and reliability results use confirmed participation records correctly.
- **TEST-009**: Verify a clean machine can import the schema and seed data, start both applications, and complete the scripted demonstration.

## 7. Risks & Assumptions

- **RISK-001**: TU SSO access may not be granted before the deadline; mitigation is the authentication adapter and seeded mock accounts.
- **RISK-002**: Map integration may consume excessive time; mitigation is to implement a marker first and add circle and rectangle only after persistence works.
- **RISK-003**: Cost allocation edge cases may create inconsistent totals; mitigation is server-side transactions and explicit decimal-rounding tests.
- **RISK-004**: Parallel work may produce incompatible API assumptions; mitigation is freezing `app/docs/api-contract.md` on Day 2 and reviewing every contract change.
- **RISK-005**: Feature work may continue too late; mitigation is mandatory feature freeze after Day 15.
- **ASSUMPTION-001**: Each contributor can work on the project daily and review at least one teammate's pull request.
- **ASSUMPTION-002**: The assessment accepts mock authentication when live TU SSO credentials are unavailable.
- **ASSUMPTION-003**: Receipt images may be represented by stored upload metadata or a local development upload path; production cloud storage is not required for the assignment.

## 8. Related Specifications / Further Reading

- `outputs/tu_squad_up_drawsql.sql`
- `outputs/TU_Squad_Up_Detailed_Physical_Design.md`
- `outputs/TU_Squad_Up_User_Flow_With_Database.png`
