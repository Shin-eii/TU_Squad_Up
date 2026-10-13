# TU Squad Up — Current Status

> Keep this file short. Maximum: approximately 30 lines. Update it when work starts, finishes, or becomes blocked.

**Last updated:** 2026-10-13  
**Current milestone:** Verify Issue #4 and Issue #5 Docker development environment
**Next checkpoint:** Run the complete Docker stack and perform browser verification

## Read this first

- The design and database proposal are complete.
- The local repository is connected to `Shin-eii/TU_Squad_Up`.
- React + Vite is the frontend stack on the feature branch from Pull Request #2.
- Express routes/controllers, MySQL configuration, mock sessions, and activity-draft creation are implemented locally.
- Issue #5 Docker definitions and teammate setup instructions are implemented locally.
- Nine backend tests and the frontend production build pass.

## Work ownership

| Person | Area | Current task | Status |
|---|---|---|---|
| Person 1 | Foundation, authentication, members, notifications | Issue #4 mock authentication | In review |
| Person 2 | Activities, discovery, map | Issue #4 free activity draft creation | In review |
| Person 3 | Participation, rules, guests | Confirm owner and begin setup Issue | Not started |
| Person 4 | Costs, payments, attendance | Confirm owner and begin setup Issue | Not started |

## Decisions waiting for humans

- Select the GitHub repository owner and integration lead.
- Confirm whether the host participates by default.

## Blockers

- Real TU SSO still requires university credentials; the approved mock adapter is used meanwhile.
- Docker Desktop is not installed on this computer, so the three-container startup needs verification on a teammate's machine.

