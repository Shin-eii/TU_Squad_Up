---
goal: Create a reproducible Docker development environment for TU Squad Up
version: 1.0
date_created: 2026-10-13
last_updated: 2026-10-13
owner: Shin-eii
status: 'In progress'
tags: [infrastructure, docker, development, mysql, node, react]
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In_progress-yellow)

Implement GitHub Issue #5 so every teammate can start the React frontend, Express API, and initialized MySQL database with one Docker Compose command.

## 1. Requirements & Constraints

- **REQ-001**: `docker compose up --build` must start MySQL, Express, and React/Vite.
- **REQ-002**: MySQL must import `sql/schema.sql` and `sql/seed.sql` on first startup.
- **REQ-003**: Source changes must reload in the API and frontend development servers.
- **SEC-001**: Passwords and session secrets must remain in an ignored local environment file.
- **CON-001**: Do not add npm dependencies or redesign the application/database architecture.
- **CON-002**: Preserve direct MySQL Workbench access on host port 3308 by default.
- **GUD-001**: Setup and recovery commands must be understandable by first-time Docker users.
- **PAT-001**: Use one multi-stage Dockerfile and one Compose file at the repository root.

## 2. Implementation Steps

### Implementation Phase 1 — Container definitions

- GOAL-001: Define isolated but connected development services.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add `Dockerfile` targets named `api` and `frontend` using Node.js 22 Alpine and existing lockfiles. | ✅ | 2026-10-13 |
| TASK-002 | Add `compose.yaml` services named `db`, `api`, and `frontend` with health checks and dependency ordering. | ✅ | 2026-10-13 |
| TASK-003 | Add bind mounts for source reload and named volumes for dependencies and MySQL data. | ✅ | 2026-10-13 |

### Implementation Phase 2 — Configuration and initialization

- GOAL-002: Initialize the database and keep credentials outside Git.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | Add `.env.docker.example` and require a private `.env.docker` file at runtime. | ✅ | 2026-10-13 |
| TASK-005 | Mount `sql/schema.sql` and `sql/seed.sql` into MySQL's first-start initialization directory. | ✅ | 2026-10-13 |
| TASK-006 | Add `frontend/vite.docker.config.js` so containerized Vite proxies `/api` to the `api` service. | ✅ | 2026-10-13 |

### Implementation Phase 3 — Documentation and verification

- GOAL-003: Document and verify the complete teammate workflow.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-007 | Add first-run, daily-use, reset, Workbench, and troubleshooting guidance to `docs/docker-development.md`. | ✅ | 2026-10-13 |
| TASK-008 | Validate Compose configuration and run backend tests plus the frontend build. |  |  |

## 3. Alternatives

- **ALT-001**: Use separate Dockerfiles for frontend and backend; rejected because one multi-stage file keeps the root setup smaller.
- **ALT-002**: Run only MySQL in Docker; rejected because teammates would still need matching Node.js installations.

## 4. Dependencies

- **DEP-001**: Docker Desktop with Docker Compose v2.
- **DEP-002**: Existing backend and frontend package lockfiles.
- **DEP-003**: Approved MySQL schema and development seed files.

## 5. Files

- **FILE-001**: `Dockerfile`, containing the API and frontend build targets.
- **FILE-002**: `compose.yaml`, containing the service network, health checks, ports, and volumes.
- **FILE-003**: `.dockerignore` and `.env.docker.example`, containing build exclusions and safe configuration examples.
- **FILE-004**: `frontend/vite.docker.config.js`, containing the container-only API proxy.
- **FILE-005**: `docs/docker-development.md`, containing team instructions.

## 6. Testing

- **TEST-001**: `docker compose config` resolves with a valid private environment file.
- **TEST-002**: All three services become healthy/running from an empty MySQL volume.
- **TEST-003**: `npm test` passes for the backend and `npm run build` passes for the frontend.
- **TEST-004**: The browser can log in with a seeded member and create an activity through the containerized stack.

## 7. Risks & Assumptions

- **RISK-001**: Docker cannot be executed on a computer until Docker Desktop is installed and running.
- **RISK-002**: MySQL initialization fails if the repository contains an outdated schema instead of the approved schema.
- **ASSUMPTION-001**: Port 3308 is the preferred Workbench port for the project owner.
- **ASSUMPTION-002**: The Docker environment is for development only, not production deployment.

## 8. Related Specifications / Further Reading

- GitHub Issue #5: `https://github.com/Shin-eii/TU_Squad_Up/issues/5`
- `AGENTS.md`
- `START_HERE.md`
- `docs/api-contract.md`
