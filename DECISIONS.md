# TU Squad Up — Decision Log

This file contains only decisions that affect more than one person or module.

## How to record a decision

Copy this format and keep it short:

```text
### DEC-000 — Short title
Date:
Status: Proposed | Approved | Rejected | Replaced
Owner:
Decision: One or two sentences.
Why: One sentence.
Affected areas: Short list.
Replaces: Decision number or None.
```

An AI may propose a decision. A human must change its status to `Approved` before the team treats it as final.

---

### DEC-001 — Use human-approved GitHub workflow

**Date:** 2026-10-13  
**Status:** Approved  
**Owner:** Project team  
**Decision:** Every code change starts from an assigned GitHub Issue, is developed on a separate branch, and enters the main branch through a human-approved Pull Request.  
**Why:** The team needs visible, understandable control over AI-generated changes.  
**Affected areas:** Entire repository  
**Replaces:** None

### DEC-002 — Use short summaries before technical details

**Date:** 2026-10-13  
**Status:** Approved  
**Owner:** Project team  
**Decision:** Every Issue, Pull Request, AI plan, and AI completion message begins with a short plain-language summary. Long technical material goes below it.  
**Why:** Every team member must understand the change before approving it.  
**Affected areas:** Issues, Pull Requests, documentation, AI prompts  
**Replaces:** None

