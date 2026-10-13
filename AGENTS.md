# Instructions for Every AI Working on TU Squad Up

## Before making changes

Read these items in this order:

1. `START_HERE.md`
2. `TEAM_STATUS.md`
3. The assigned GitHub Issue
4. Relevant entries in `DECISIONS.md`
5. Relevant system-design and database files linked from `START_HERE.md`

Then give the human this short preview and wait for approval:

```text
Goal: one sentence
Files I expect to change: short list
What will work afterward: one sentence
Important risk or decision: one sentence, or "None"
```

Do not begin a material code change until the human replies with approval such as “go,” “approved,” or “continue.”

## While working

- Work only on the assigned Issue.
- Prefer small, understandable changes.
- Explain unfamiliar terms in plain language.
- Do not redesign another person's module without approval.
- Do not change an approved API contract or database schema silently.
- Add or update tests for changed behavior.
- Preserve unrelated human work.
- Never expose passwords, tokens, `.env` values, or private university data.

## Human approval is required before

- Changing the database schema.
- Changing an existing API request or response.
- Installing or removing a dependency.
- Changing authentication, authorization, payments, or cost calculations.
- Deleting or renaming files, tables, fields, endpoints, or features.
- Expanding the Issue beyond its acceptance criteria.
- Resolving a conflict between documents or requirements.
- Merging a Pull Request, deploying, force-pushing, or rewriting Git history.

When approval is needed, use this format:

```text
Decision needed: one sentence
Recommended choice: A or B
A: benefit and cost in one sentence
B: benefit and cost in one sentence
What I will do after approval: one sentence
```

Do not provide a long essay unless the human asks for details.

## Before finishing

Give the human this summary:

```text
Done: what now works
Changed: main files or modules
Tested: tests run and result
Not done: anything remaining
Human should check: one concrete action
```

The AI may prepare commits and a Pull Request, but a human must review and approve the final result.

