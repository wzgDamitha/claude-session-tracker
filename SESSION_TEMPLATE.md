# Session Report Template

Each Claude Code session agent should write a markdown file to `.claude/sessions/` using this format.
The filename should be: `<session-id>.md` (e.g., `session-abc123.md`)

---

```markdown
---
session_id: "session-abc123"
title: "Implement user authentication"
branch: "feature/auth"
status: "in_progress"          # not_started | in_progress | blocked | completed | failed
started_at: "2026-03-28T10:00:00Z"
updated_at: "2026-03-28T11:30:00Z"
agent_model: "claude-opus-4-6"
repository: "myorg/myrepo"
tags: ["auth", "backend", "security"]
progress: 65                   # 0-100
---

## Objective
Brief description of what this session is trying to accomplish.

## Tasks
- [x] Reviewed existing auth middleware
- [x] Added JWT token generation
- [x] Created login endpoint
- [ ] Added refresh token logic
- [ ] Write tests for auth flow

## Changes Made
- `src/auth/jwt.ts` — Created JWT utility with sign/verify functions
- `src/routes/login.ts` — New login POST endpoint
- `src/middleware/auth.ts` — Updated to use new JWT logic

## Key Decisions
- Chose JWT over session cookies for stateless auth
- Token expiry set to 15 minutes with refresh token pattern

## Blockers
_None currently._

## Notes
Working smoothly. Refresh token logic is next.
```

## How to Use

Add this to your `CLAUDE.md` or session instructions:

```
Before ending your session, write a detailed session report to
.claude/sessions/<session-id>.md following the template in SESSION_TEMPLATE.md.
Include your session ID, current status, progress percentage, completed/pending
tasks, files changed, and any blockers.
```
