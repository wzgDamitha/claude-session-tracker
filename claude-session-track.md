# Claude Session Tracker — Agent Instructions

> **You are reading this because a user has asked you to track your session progress.**
> Follow every instruction in this file carefully.

---

## Your Task

You must write and maintain a **session progress report** as a markdown file while you work. This file is read by a dashboard app that visualizes your progress for the user.

---

## Output Folder

Save your session report to:

```
F:\Future\Claude Project Tracker\.claude\sessions\
```

> **If the user told you to use a different folder, use that instead.**

---

## Filename

Name your file using your session ID:

```
<session-id>.md
```

- Use your session ID from the conversation URL (e.g., `session_015WXoyPeSg5LLXjwMqzqnYM.md`)
- If you can't determine your session ID, use a descriptive name: `session-<short-task-description>.md` (e.g., `session-fix-login-bug.md`)

---

## When to Write

1. **At the start** of your session — create the file with `status: "in_progress"` and `progress: 0`
2. **During work** — update the file after completing significant tasks (update `progress`, check off tasks, add to Changes Made)
3. **At the end** of your session — do a final update with accurate `status`, `progress`, and all completed/pending tasks

**Always update the same file. Never create duplicates.**

---

## File Format

Use this exact structure with YAML frontmatter followed by markdown sections:

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
- `path/to/other-file.ts` — Description of change

## Key Decisions
- Decision made and brief reasoning
- Another decision and why

## Blockers
_None._

## Notes
Any additional context, next steps, or handoff notes.
```

---

## Field Reference

| Field          | Required | Values / Format                                                  |
|----------------|----------|------------------------------------------------------------------|
| `session_id`   | Yes      | Your session ID or unique identifier                             |
| `title`        | Yes      | Brief title for the dashboard card (keep under 60 chars)         |
| `branch`       | Yes      | Git branch you're working on                                     |
| `status`       | Yes      | `not_started` · `in_progress` · `blocked` · `completed` · `failed` |
| `started_at`   | Yes      | ISO 8601 timestamp (when you started)                            |
| `updated_at`   | Yes      | ISO 8601 timestamp (update this every time you edit the file)    |
| `agent_model`  | Yes      | Model you're running as (e.g., `claude-opus-4-6`)               |
| `repository`   | Yes      | Repository in `owner/repo` format                                |
| `tags`         | Yes      | Array of keyword tags (e.g., `["backend", "auth", "bugfix"]`)   |
| `progress`     | Yes      | Integer `0`–`100` representing completion percentage             |

---

## Section Guide

### Objective
- 1-2 sentences. What is the goal of this session?

### Tasks
- Use `- [x]` for completed and `- [ ]` for pending
- Be granular — each meaningful step gets its own checkbox
- Order tasks logically (done first, pending after)

### Changes Made
- List every file you created or modified
- Format: `path/to/file.ext` — brief description
- Include new files, modified files, and deleted files

### Key Decisions
- Any architectural, design, or trade-off decisions
- Include the "why" not just the "what"

### Blockers
- List anything preventing progress with enough detail for someone else to understand
- If no blockers, write `_None._`

### Notes
- Handoff context for the next session
- Anything the user should know
- Suggested next steps

---

## Status Guide

| Status         | When to Use                                                |
|----------------|------------------------------------------------------------|
| `not_started`  | File created but no real work done yet                     |
| `in_progress`  | Actively working and making progress                       |
| `blocked`      | Cannot continue — waiting on external dependency or issue  |
| `completed`    | All tasks finished successfully                            |
| `failed`       | Session ended without completing due to unrecoverable errors |

---

## Progress Scale

| Range     | Meaning                                      |
|-----------|----------------------------------------------|
| `0-10`    | Just started, reading and understanding code  |
| `20-40`   | Initial implementation underway               |
| `50-70`   | Core work done, working on remaining tasks    |
| `80-90`   | Nearly done, final testing and polish         |
| `100`     | All tasks complete                            |

---

## Rules

1. **Always update `updated_at`** to the current time on every edit
2. **Never create duplicate files** — update the existing one
3. **Be honest about `progress`** — reflect actual completion, not time spent
4. **Be specific in Tasks** — vague tasks like "work on feature" are not useful
5. **Update status accurately** — if you're blocked, say so; if you failed, say so
6. **Include all file changes** — the user relies on this to understand what you did
7. **Write for handoff** — assume another agent or person will read this to continue your work
