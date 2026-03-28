# Session Tracker File Template

Every project has **one** tracking file: `.claude/sessions/session-tracker.md`

All sessions read and update the same file. See `claude-session-track.md` for full agent instructions.

---

```markdown
---
title: "Project name or description"
repository: "owner/repo-name"
status: "in_progress"          # not_started | in_progress | blocked | completed | failed
tracking_start: "full"         # full | mid_project
created_at: "2026-03-28T10:00:00Z"
updated_at: "2026-03-28T11:30:00Z"
current_session: "session_abc123"
current_branch: "feature/auth"
agent_model: "claude-opus-4-6"
update_mode: "manual"          # auto | manual | budget
tags: ["backend", "auth"]
progress: 50                   # 0-100
---

## Objective
The overall goal of this project.

## Project Summary (mid_project only)
> Summarizes the project state when tracking began.

- **What this project is:** One-line description
- **What's been done:** High-level bullet points
- **Current state:** Where things stand
- **Tech stack:** Key technologies

## Tasks
- [x] Completed task
- [ ] Pending task

## Changes Made
### Session: session_abc123 (feature/auth) — 2026-03-28
- `src/file.ts` — Description of change

## Key Decisions
- Decision and reasoning

## Blockers
_None._

## Activity Log
### [2026-03-28 10:00:00] Session started — session_abc123 (feature/auth)
Beginning work on this project.

### [2026-03-28 11:30:00] Session paused — session_abc123
Stopping for now. Next: continue with pending tasks.

## Notes
Handoff notes for the next session.
```
