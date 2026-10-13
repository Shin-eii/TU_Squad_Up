# Contributing to TU Squad Up

## Simple workflow

```text
Issue approved by human
→ create branch
→ AI gives short plan
→ human approves plan
→ implement and test
→ open Pull Request
→ teammate reviews
→ author fixes problems
→ human approves and merges
```

## 1. Create or select an Issue

The Issue must say:

- What problem are we solving?
- What should work when it is finished?
- What is not included?
- Who owns it?

Do not start from an informal chat message if no Issue records the approved scope.

## 2. Create a branch

Use one of these patterns:

```text
feature/issue-12-create-activity
fix/issue-18-capacity-check
docs/issue-21-api-contract
```

Never work directly on `main`.

## 3. Ask the AI to prepare a short plan

Example prompt:

```text
Read START_HERE.md, TEAM_STATUS.md, AGENTS.md, Issue #12, and the relevant design files.
Explain your plan using the required four-line preview. Do not change files until I approve.
```

## 4. Implement in small steps

- Keep one Issue focused on one result.
- Commit working checkpoints.
- Do not mix unrelated formatting or refactoring into the same change.
- Run relevant tests before opening a Pull Request.

Suggested commit messages:

```text
feat(activity): add activity creation endpoint
fix(participation): prevent approval above capacity
test(cost): cover three-person rounding
docs(api): explain join response
```

## 5. Open a Pull Request

Complete every section of the Pull Request template. The top summary must be understandable without reading the code.

Keep a Pull Request small enough that a teammate can review it in approximately 15 minutes. Split it if necessary.

## 6. Review

The reviewer checks:

- Does it do what the Issue requested?
- Is the short summary accurate?
- Are database and API contracts preserved?
- Are permissions and validation handled by the backend?
- Were tests run?
- Is the change understandable enough to maintain?

Review labels:

- `BLOCKER`: unsafe or functionally incorrect; must fix.
- `QUESTION`: explanation or human decision needed.
- `SUGGESTION`: optional improvement; does not block merging.

## 7. Merge

Merge only when:

- Acceptance criteria pass.
- Tests pass.
- At least one teammate reviewed it.
- A human approved it.
- No unresolved `BLOCKER` or `QUESTION` remains.

Use **Squash and merge** so one Issue produces one clear commit on `main`.

## 8. Update shared memory

After merging:

- Update `TEAM_STATUS.md` if ownership, status, milestone, decision, or blocker changed.
- Add an entry to `DECISIONS.md` only when the team approved a cross-module decision.
- Close the Issue and link the merged Pull Request.

## AI boundaries

AI may inspect, explain, implement an approved Issue, run tests, and prepare a Pull Request.

AI may not independently approve scope, approve architecture decisions, merge, deploy, force-push, delete important data, or expose secrets.

