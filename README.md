# TU Squad Up

Campus activity coordination for the Thammasat University community.

## Read this first

**Current stage:** First core vertical slice: mock TU login and MySQL-backed activity drafts.

Every team member and AI assistant must read these files before changing anything:

1. [`START_HERE.md`](START_HERE.md) — project orientation and reading order
2. [`TEAM_STATUS.md`](TEAM_STATUS.md) — what is happening now, owners, decisions, and blockers
3. [`AGENTS.md`](AGENTS.md) — mandatory rules for AI-assisted work
4. The assigned GitHub Issue — the approved task and acceptance criteria
5. [`DECISIONS.md`](DECISIONS.md) — approved decisions affecting multiple modules

## Human-controlled workflow

```text
Create Issue
→ human approves scope
→ AI proposes a short plan
→ human approves plan
→ AI implements on a branch
→ open Pull Request
→ teammate reviews
→ human approves and merges
```

AI assistants may implement and test approved tasks. They may not independently approve major decisions, change shared contracts, merge, deploy, or expose secrets.

## Project documentation

- [System-design brain dump](outputs/TU_Squad_Up_System_Design_Brain_Dump.md)
- [Database schema](outputs/tu_squad_up_drawsql.sql)
- [Twenty-day implementation roadmap](plan/feature-tu-squad-up-mvp-1.md)
- [Contribution workflow](CONTRIBUTING.md)

## Project architecture

```text
React frontend → Express REST API → MySQL database
```

The central table is `activities`. The `participations` table connects members and guests to activities.

## Run the Issue #4 development build

1. In MySQL Workbench, create a database named `tu_squad_up`.
2. Run [`sql/schema.sql`](sql/schema.sql), followed by [`sql/seed.sql`](sql/seed.sql).
3. Copy `.env.example` to `.env` and enter your local MySQL username, password, and a private session secret. Never commit `.env`.
4. In the repository root, run `npm install` and then `npm run dev`.
5. In another terminal, run `cd frontend`, `npm install`, and `npm run dev`.
6. Open `http://localhost:5173`, select a mock TU identity, and create a free activity draft.

The frontend sends `/api` requests to Express on port `3000` through the Vite development proxy. Run backend tests with `npm test` and verify the frontend with `cd frontend && npm run build`.

