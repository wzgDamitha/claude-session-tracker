# Claude Session Tracker — Agent Instructions

> **You are reading this because a user has asked you to track your session progress.**
> Follow every instruction in this file. This is a BLOCKING REQUIREMENT.

---

## 1. Output Folder

Save your session report to:

```
__SESSION_FOLDER_PATH__
```

> **The user MUST tell you which folder to use.** If they haven't, ask them before proceeding.
> The folder should already exist. If it doesn't, create it.

---

## 2. Update Mode

The user will tell you which update mode to use. If they don't specify, default to **manual**.

| Mode       | What You Do                                                    | Token Cost |
|------------|----------------------------------------------------------------|------------|
| **auto**   | Update the report after **every prompt/response** cycle        | Higher     |
| **manual** | Update **only** when the user asks (e.g., "update tracker")   | Medium     |
| **budget** | Update **twice**: once at session start, once at session end   | Lowest     |

---

## 3. Filename

```
<session-id>.md
```

- Use your session ID from the conversation URL (e.g., `session_015WXoyPeSg5LLXjwMqzqnYM.md`)
- If unknown, use: `session-<short-task-description>.md`

**Never create duplicate files. Always update the same file.**

---

## 4. File Format

Use this exact structure — YAML frontmatter + markdown sections:

```markdown
---
session_id: "your-session-id"
title: "Short description of what you're working on"
branch: "feature/branch-name"
status: "in_progress"
started_at: "2026-03-28T10:00:00Z"
updated_at: "2026-03-28T11:30:00Z"
agent_model: "claude-opus-4-6"
repository: "owner/repo-name"
update_mode: "auto"
tags: ["relevant", "tags"]
progress: 50
---

## Objective
One or two sentences explaining what this session is accomplishing.

## Tasks
- [x] Completed task description
- [x] Another completed task
- [ ] Pending task description
- [ ] Another pending task

## Changes Made
- `path/to/file.ts` — What was changed and why
- `path/to/other.ts` — Description of change

## Key Decisions
- Decision made and brief reasoning

## Blockers
_None._

## Activity Log
### [2026-03-28 10:00:00] Session started
Beginning work on user authentication feature.

### [2026-03-28 10:15:00] Completed: Review existing auth code
Reviewed middleware in `src/middleware/auth.ts`. Found it uses deprecated session-based approach.

### [2026-03-28 10:32:00] Completed: Implement JWT utility
Created `src/auth/jwt.ts` with sign/verify functions using RS256.

### [2026-03-28 10:45:00] In progress: Login endpoint
Working on POST /api/login with credential validation.

## Notes
Any additional context, next steps, or handoff notes.
```

---

## 5. Field Reference

| Field          | Required | Values / Format                                                  |
|----------------|----------|------------------------------------------------------------------|
| `session_id`   | Yes      | Your session ID or unique identifier                             |
| `title`        | Yes      | Brief title for dashboard card (under 60 chars)                  |
| `branch`       | Yes      | Git branch you're working on                                     |
| `status`       | Yes      | `not_started` · `in_progress` · `blocked` · `completed` · `failed` |
| `started_at`   | Yes      | ISO 8601 timestamp when session started                          |
| `updated_at`   | Yes      | ISO 8601 timestamp — **update every time you edit this file**    |
| `agent_model`  | Yes      | Model you're running as (e.g., `claude-opus-4-6`)               |
| `repository`   | Yes      | Repository in `owner/repo` format                                |
| `update_mode`  | Yes      | `auto` · `manual` · `budget`                                    |
| `tags`         | Yes      | Array of keyword tags                                            |
| `progress`     | Yes      | Integer `0`–`100`                                                |

---

## 6. Activity Log Format

The Activity Log is a timestamped record of what happened during the session. Each entry:

```markdown
### [YYYY-MM-DD HH:MM:SS] Short title
Optional details about what was done, found, or decided.
```

**Rules per update mode:**

- **auto**: Add a log entry after every prompt/response. Include what was done and any findings.
- **manual**: Add log entries only when updating. Batch recent work into summary entries.
- **budget**: Add two entries only — "Session started" and "Session completed" with a summary.

---

## 7. When to Update

### Auto Mode
1. **After every prompt/response** — update `updated_at`, `progress`, check off Tasks, add Activity Log entry
2. **On status change** — update `status` immediately (e.g., if you become blocked)

### Manual Mode
1. **At session start** — create the file with `status: "in_progress"`, `progress: 0`
2. **When user asks** — update everything: tasks, progress, changes, activity log
3. **At session end** — final update with accurate status and progress

### Budget Mode
1. **At session start** — create the file with basic info, `progress: 0`, one activity log entry
2. **At session end** — single comprehensive update: all tasks, changes, decisions, final status, one summary activity log entry

---

## 8. Status Guide

| Status         | When to Use                                                |
|----------------|------------------------------------------------------------|
| `not_started`  | File created but no real work done yet                     |
| `in_progress`  | Actively working and making progress                       |
| `blocked`      | Cannot continue — waiting on dependency or issue           |
| `completed`    | All tasks finished successfully                            |
| `failed`       | Session ended due to unrecoverable errors                  |

---

## 9. Progress Scale

| Range     | Meaning                                      |
|-----------|----------------------------------------------|
| `0-10`    | Just started, reading and understanding       |
| `20-40`   | Initial implementation underway               |
| `50-70`   | Core work done, working on remaining tasks    |
| `80-90`   | Nearly done, final testing and polish         |
| `100`     | All tasks complete                            |

---

## 10. Rules

1. **Always update `updated_at`** to current time on every edit
2. **Never create duplicate files** — always update the existing one
3. **Be honest about `progress`** — reflect actual completion, not time spent
4. **Be specific in Tasks** — vague tasks are not useful
5. **Log timestamps accurately** — use the actual time, not estimates
6. **Include all file changes** in Changes Made
7. **Write for handoff** — assume another agent will read this to continue your work
8. **Respect the update mode** — don't waste tokens on auto-updates if mode is budget
