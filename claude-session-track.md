# Claude Session Tracker — Agent Instructions

> **You are reading this because a user has asked you to track your session progress.**
> Follow every instruction in this file. This is a BLOCKING REQUIREMENT.

---

## 1. The Tracking File

Every project has **one** tracking file: `.claude/sessions/session-tracker.md`
All sessions share and update the same file. Create `.claude/sessions/` if it doesn't exist.

> **Override:** If the user specifies a different folder, use that instead.

### On Session Start

1. **Check if `session-tracker.md` already exists** in the sessions folder
2. **If it exists** — read it, then update it (see Section 4: Continuing)
3. **If it doesn't exist** — create it fresh (see Section 3: File Format)
4. **Check if `notes.md` exists** in the same folder — if it does, **read it**. These are notes and instructions left by the user from the dashboard. **NEVER modify `notes.md`.**
5. **Check if `agent-notes.md` exists** — if it does, read it for notes left by previous agent sessions.

**NEVER create a new file if one already exists. ALWAYS update the existing file.**

---

## 2. New Project vs Existing Project

Before writing, determine whether this project is **new** or **already in progress**.

| Situation | `tracking_start` value |
|-----------|------------------------|
| Brand-new project with no prior work | `full` |
| Project existed before tracking was added | `mid_project` |
| File already exists (another session created it) | **Keep the existing value — do not change it** |

> **If unsure, default to `mid_project`.** Better to summarize than waste tokens reconstructing history.

### If `mid_project` (first time creating the file)

**DO NOT** read the entire codebase or git history. Instead:

1. **Quick scan** — project structure, `git log --oneline -15`, README/docs
2. **Write a `## Project Summary` section** covering what the project is, what's done, current state
3. **List tasks** — check off what appears done, leave pending items unchecked
4. **Start logging from this point forward**

---

## 3. File Format (Creating New)

Use this annotated template when creating `session-tracker.md` for the first time.
Fields are commented with allowed values.

````markdown
---
title: "Project name or description"  # under 60 chars
repository: "owner/repo-name"
version_control: "git_remote"  # git_remote | git_local | none — auto-detect with git rev-parse / git remote -v
status: "in_progress"  # not_started | in_progress | blocked | completed | failed
tracking_start: "full"  # full | mid_project — set once, never change
created_at: "2026-03-28T10:00:00Z"  # ISO 8601, set once
updated_at: "2026-03-28T11:30:00Z"  # ISO 8601, update every edit
current_session: "session_abc123"
current_branch: "feature/auth"
agent_model: "claude-opus-4-6"
update_mode: "manual"  # auto | manual | budget
tags: ["backend", "auth"]
progress: 30  # integer 0–100
---

## Objective
The overall goal of this project.

<!-- ONLY for mid_project: add this section summarizing prior state -->
## Project Summary
> Summarizes project state when tracking began. Activity log only covers work from this point forward.

- **What this project is:** Brief description and tech stack
- **What's been done:** Completed features/milestones
- **Current state:** What's working, what's next

## Tasks
- [x] Completed task
- [ ] Pending task

## Changes Made
### Session: session_abc123 (feature/auth) — 2026-03-28
- `src/auth/jwt.ts` — Created JWT utility
- `src/routes/login.ts` — New login endpoint

## Key Decisions
- Chose JWT over session cookies for stateless auth

## Blockers
_None._

## Activity Log
<!-- For full: first entry is "Session started" -->
<!-- For mid_project: first entry is "Tracking started (mid-project)" -->
### [2026-03-28 10:00:00] Session started — session_abc123 (feature/auth)
Beginning work on user authentication.

### [2026-03-28 10:30:00] Completed: JWT utility
Created sign/verify functions using RS256.

### [2026-03-28 11:30:00] Session paused — session_abc123
Stopping for now. Login endpoint is next.

## Notes
Next session should pick up the login endpoint work.
````

### Differences by `tracking_start` value

- **`full`**: Include all sections above except `## Project Summary`. First log entry: `Session started`.
- **`mid_project`**: Include `## Project Summary` (from a quick scan, not deep-dive). First log entry: `Tracking started (mid-project)`. Pre-existing completed tasks should be checked off in Tasks.

---

## 4. Continuing an Existing File

When `session-tracker.md` already exists, **read it first**, then update these parts:

### Frontmatter Updates
- `updated_at` → current time
- `current_session` → your session ID
- `current_branch` → your current git branch
- `agent_model` → your model
- `update_mode` → the mode the user specified (or keep existing)
- `status` → update if changed
- `progress` → update based on task completion
- **DO NOT change:** `title`, `repository`, `tracking_start`, `created_at`, `tags` (unless the user asks)

### Tasks
- **Check off** tasks you completed: `- [ ]` → `- [x]`
- **Add new tasks** at the bottom of the pending list
- **Do not remove or reorder** existing tasks

### Changes Made
- **Add a new session sub-heading** and list your changes under it:
  ```markdown
  ### Session: session_newID (branch-name) — 2026-03-29
  - `file.ts` — What changed
  ```
- **Do not modify or remove** previous sessions' entries
- **Rolling window:** Keep the last 5 sessions' changes visible. Archive older sessions by replacing them with `> N earlier sessions' changes archived.`

### Key Decisions
- **Append** new decisions below existing ones. Do not remove previous decisions.

### Blockers
- **Replace** with current blockers (or `_None._` if resolved)

### Activity Log
- **Add a session start entry** at the bottom:
  ```
  ### [2026-03-29 09:00:00] Session started — session_newID (branch-name)
  Continuing from previous session. Focus: webhooks and tests.
  ```
- **Append new entries** below as you work
- **Add a session end entry** when done:
  ```
  ### [2026-03-29 12:00:00] Session completed — session_newID
  Finished webhook handlers and wrote 8 tests. All passing.
  ```
- **NEVER modify or remove** previous sessions' log entries
- **Rolling window:** Keep the last 15 entries. Archive older entries by replacing them with `> N earlier entries archived.`

### Notes
- **Replace** with current notes (this section is always up-to-date, not cumulative)

---

## 5. Modes & Logging

The user will tell you which mode to use. **Default: `manual`.**

### Auto Mode
- **Token cost:** Higher
- **When to update:** After **every prompt/response** cycle
- **Logging:** One activity log entry per prompt/response. Include what was done and key findings.
- **Timing:** Read/create file at session start. Update `updated_at`, `progress`, check off tasks, add log entry after each exchange. Update `status` immediately on change. Final update with session end log entry.

### Manual Mode
- **Token cost:** Medium
- **When to update:** **Only** when the user asks (e.g., "update tracker")
- **Logging:** Batch recent work into summary entries when updating.
- **Timing:** Read/create file at session start with start entry. Full update (tasks, progress, changes, activity log) when user asks. Final update with session end log entry.

### Budget Mode
- **Token cost:** Lowest
- **When to update:** **Twice** — once at session start, once at session end
- **Logging:** Two entries only: session start and session end.
- **Timing:** Read/create file at session start. One comprehensive update with session end log entry.
- **Partial read optimization:** At session start, agents only need to read the **frontmatter** and **Notes** section to get context. Skip reading the full Activity Log and Changes Made sections to save tokens.

### Activity Log Entry Format

```markdown
### [YYYY-MM-DD HH:MM:SS] Short descriptive title
Optional details about what was done, found, or decided.
```

**Session boundary titles** (always include session ID and branch):
- `Session started — session_abc123 (feature/auth)` — opening entry
- `Tracking started (mid-project) — session_abc123 (feature/auth)` — first entry for mid_project
- `Session paused — session_abc123` — stopping but not done
- `Session completed — session_abc123` — all work for this session is done

**Work entry titles:**
- `Completed: <task name>` — task finished
- `In progress: <task name>` — starting new work
- `Blocked: <reason>` — hitting a blocker
- `Decision: <summary>` — making a key choice

---

## 6. Status & Progress

| Status | When to Use |
|--------|-------------|
| `not_started` | File created but no real work done yet |
| `in_progress` | Actively working and making progress |
| `blocked` | Cannot continue — waiting on dependency or issue |
| `completed` | All tasks finished successfully |
| `failed` | Session ended due to unrecoverable errors |

| Progress | Meaning |
|----------|---------|
| `0–10` | Just started, reading and understanding |
| `20–40` | Initial implementation underway |
| `50–70` | Core work done, working on remaining tasks |
| `80–90` | Nearly done, final testing and polish |
| `100` | All tasks complete |

---

## 7. Tech Stack File (`tech-stack.md`)

When the user requests it, create or update `tech-stack.md` in the same `.claude/sessions/` folder. This file gives the dashboard (and future sessions) a quick overview of the project's technical landscape.

**Format:**
```markdown
# Tech Stack

> Last updated: 2026-03-28 14:00:00

## Stack
- **Language:** TypeScript
- **Runtime:** Node.js 20
- **Framework:** Express.js

## Project Structure
src/
├── routes/       # API endpoints
├── services/     # Business logic
└── utils/        # Shared helpers

## Core Features
- User authentication (JWT)

## Recent Changes
### [2026-03-28 14:00:00] Added PostgreSQL
Migrated from SQLite to PostgreSQL for production readiness.
```

**Rules:**
- **Only create when the user asks** — don't auto-create this file
- **Keep it concise** — quick reference, not documentation
- **Update "Recent Changes"** when a decision affects the stack or structure
- **For mid-project tracking**, write what you can determine from a quick scan — don't deep-dive
- **Always update `Last updated` timestamp** when editing

---

## 8. Rules

1. **`notes.md` is read-only** — read it at session start for user instructions. Never modify it.
2. **`agent-notes.md` is for agent-to-user and agent-to-agent communication.** Append entries, never overwrite. Format:
   ```markdown
   ### [YYYY-MM-DD HH:MM:SS] Agent
   Your note here. Can be multiple lines.
   ```
   Write notes for: decisions needing review, warnings/blockers, handoff context, questions for the user. Create the file with `# Agent Notes` header if it doesn't exist.
3. **Set `version_control`** — check with `git rev-parse --is-inside-work-tree` and `git remote -v`. Set `git_remote` if remotes exist, `git_local` if git but no remote, `none` if no git.
4. **`tech-stack.md`** — only create/update when user requests it (see Section 7).
5. **Be honest about `progress`** — reflect actual task completion, not time spent.
6. **Write Notes for handoff** — the next session reads this to understand what to do.
