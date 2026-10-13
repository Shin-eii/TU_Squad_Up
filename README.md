# TU Squad Up

Campus activity coordination for the Thammasat University community.

## Read this first

**Current stage:** Initial setup and collaboration workflow. The production application has not been implemented yet.

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

