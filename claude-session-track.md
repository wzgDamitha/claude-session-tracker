# Claude Session Tracker — Agent Instructions

> **You are reading this because a user has asked you to track your session progress.**
> Follow every instruction in this file. This is a BLOCKING REQUIREMENT.

---

## 1. Output Folder

Save your session report to the `.claude/sessions/` folder **inside this project's root directory**.

For example, if you are working in `/home/user/my-project`, write to:
```
/home/user/my-project/.claude/sessions/
```

If the `.claude/sessions/` directory does not exist, **create it**.

> **Override:** If the user specifies a different folder, use that instead.

---

## 2. Update Mode

The user will tell you which update mode to use. **If they don't specify, default to `manual`.**

| Mode       | What You Do                                                    | Token Cost |
|------------|----------------------------------------------------------------|------------|
| **auto**   | Update the report after **every prompt/response** cycle        | Higher     |
| **manual** | Update **only** when the user asks (e.g., "update tracker")   | Medium     |
| **budget** | Update **twice**: once at session start, once at session end   | Lowest     |

---

## 3. Filename

**CRITICAL: The filename MUST start with `session-` or `session_`.** The tracker app ignores all other `.md` files. Any file that does not match this pattern will **not appear** in the dashboard.

```
session-<identifier>.md
```

**Use one of these naming strategies (in order of preference):**

1. **Session ID from URL** — `session_015WXoyPeSg5LLXjwMqzqnYM.md`
2. **Descriptive name** — `session-fix-login-bug.md`, `session-add-auth-feature.md`
3. **Date-based** — `session-2026-03-28-auth-work.md`

**Rules:**
- Filename must start with `session-` or `session_` (case-insensitive)
- Use only letters, numbers, hyphens, and underscores after the prefix
- Keep it short but descriptive
- **Never create duplicate files** — always update the same file throughout the session

---

## 4. File Format

Use this exact structure — YAML frontmatter followed by markdown sections:

````markdown
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
````

---

## 5. Field Reference

| Field          | Required | Values / Format                                                  |
|----------------|----------|------------------------------------------------------------------|
| `session_id`   | Yes      | Your session ID or a unique identifier                           |
| `title`        | Yes      | Brief title for dashboard card (under 60 chars)                  |
| `branch`       | Yes      | Git branch you're working on                                     |
| `status`       | Yes      | `not_started` · `in_progress` · `blocked` · `completed` · `failed` |
| `started_at`   | Yes      | ISO 8601 timestamp when session started                          |
| `updated_at`   | Yes      | ISO 8601 timestamp — **update this every time you edit the file** |
| `agent_model`  | Yes      | Model you're running as (e.g., `claude-opus-4-6`)               |
| `repository`   | Yes      | Repository in `owner/repo` format                                |
| `update_mode`  | Yes      | `auto` · `manual` · `budget`                                    |
| `tags`         | Yes      | Array of keyword tags (e.g., `["backend", "auth", "bugfix"]`)   |
| `progress`     | Yes      | Integer `0`–`100` representing completion percentage             |

---

## 6. Required Sections

Every session report **must** include these sections after the frontmatter:

### `## Objective`
1–2 sentences. What is the goal of this session?

### `## Tasks`
Checkbox list of work items. Use `- [x]` for done and `- [ ]` for pending.
- Be granular — each meaningful step gets its own checkbox
- Order: completed tasks first, then pending

### `## Changes Made`
Every file you created, modified, or deleted:
- Format: `` `path/to/file.ext` `` — brief description of what changed
- Include new files, modified files, **and** deleted files

### `## Key Decisions`
Any architectural, design, or trade-off decisions. Include the *why*, not just the *what*.
- If no decisions were made, write `_None._`

### `## Blockers`
Anything preventing progress, with enough detail for someone else to understand.
- If no blockers, write `_None._`

### `## Activity Log`
Timestamped record of what happened. This is the core of session tracking.

Each entry format:
```markdown
### [YYYY-MM-DD HH:MM:SS] Short descriptive title
Optional details about what was done, found, or decided.
Can be multiple lines if needed.
```

**Entry titles should follow this pattern:**
- `Session started` — first entry
- `Completed: <task name>` — when a task is finished
- `In progress: <task name>` — when starting a new task
- `Blocked: <reason>` — when hitting a blocker
- `Decision: <summary>` — when making a key decision
- `Session completed` / `Session paused` — last entry

**Activity log rules per update mode:**

| Mode       | What to Log                                                           |
|------------|-----------------------------------------------------------------------|
| **auto**   | One entry per prompt/response. Include what was done and key findings |
| **manual** | Batch recent work into summary entries when updating                  |
| **budget** | Two entries only: "Session started" and "Session completed/paused"    |

### `## Notes`
Handoff context: next steps, things to watch out for, suggestions for the next session.

---

## 7. When to Write / Update

### Auto Mode
| When                        | What to Do                                                        |
|-----------------------------|-------------------------------------------------------------------|
| **Session start**           | Create the file. Status `in_progress`, progress `0`, first log entry |
| **After each prompt/response** | Update `updated_at`, `progress`, check off tasks, add log entry |
| **On status change**        | Update `status` immediately (e.g., when blocked)                  |
| **Session end**             | Final update with accurate status, progress, and closing log entry |

### Manual Mode
| When                        | What to Do                                                        |
|-----------------------------|-------------------------------------------------------------------|
| **Session start**           | Create the file. Status `in_progress`, progress `0`               |
| **When user asks**          | Full update: tasks, progress, changes, activity log               |
| **Session end**             | Final update with accurate status and progress                    |

### Budget Mode
| When                        | What to Do                                                        |
|-----------------------------|-------------------------------------------------------------------|
| **Session start**           | Create the file with basic info, progress `0`, one log entry      |
| **Session end**             | One comprehensive update: all tasks, changes, decisions, final log |

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
| `0–10`    | Just started, reading and understanding       |
| `20–40`   | Initial implementation underway               |
| `50–70`   | Core work done, working on remaining tasks    |
| `80–90`   | Nearly done, final testing and polish         |
| `100`     | All tasks complete                            |

---

## 10. Rules

1. **Filename must start with `session-` or `session_`** — this is non-negotiable, other files are invisible to the tracker
2. **Always update `updated_at`** to current time on every edit
3. **Never create duplicate files** — always update the existing one
4. **Be honest about `progress`** — reflect actual completion, not time spent
5. **Be specific in Tasks** — vague tasks like "work on feature" are useless
6. **Log timestamps accurately** — use the actual current time
7. **Include all file changes** in Changes Made — the user depends on this
8. **Write for handoff** — assume another agent or person continues from where you left off
9. **Respect the update mode** — don't waste tokens on auto-frequency updates in budget mode
10. **Create the `.claude/sessions/` directory** if it doesn't exist — don't fail silently

---

## Quick Start

Copy-paste this to tell an agent what to do:

> Read the file `claude-session-track.md` and follow its instructions.
> Write your session report to this project's `.claude/sessions/` folder.
> Use **manual** mode.
