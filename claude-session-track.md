# Claude Session Tracker — Agent Instructions

> **You are reading this because a user has asked you to track your session progress.**
> Follow every instruction in this file. This is a BLOCKING REQUIREMENT.

---

## 1. The Tracking File

Every project has **one** tracking file. All sessions share and update the same file.

**Filename:** `session-tracker.md`
**Location:** `.claude/sessions/session-tracker.md` inside the project root

For example, if you are working in `/home/user/my-project`:
```
/home/user/my-project/.claude/sessions/session-tracker.md
```

If the `.claude/sessions/` directory does not exist, **create it**.

> **Override:** If the user specifies a different folder, use that instead.

### On Session Start

1. **Check if `session-tracker.md` already exists** in the sessions folder
2. **If it exists** — read it, then update it (see Section 5: Continuing an Existing File)
3. **If it doesn't exist** — create it fresh (see Section 4: File Format)
4. **Check if `notes.md` exists** in the same folder — if it does, **read it**. These are notes and instructions left by the user from the dashboard. Incorporate any relevant context into your work.
5. **Check if `agent-notes.md` exists** — if it does, read it for notes left by previous agent sessions.

**NEVER create a new file if one already exists. ALWAYS update the existing file.**
**NEVER modify `notes.md`** — it is written by the user, not by agents.
**Use `agent-notes.md`** to leave notes for the user or the next session (see Agent Notes below).

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

## 3. Update Mode

The user will tell you which mode to use. **Default: `manual`.**

| Mode       | What You Do                                                    | Token Cost |
|------------|----------------------------------------------------------------|------------|
| **auto**   | Update the file after **every prompt/response** cycle          | Higher     |
| **manual** | Update **only** when the user asks (e.g., "update tracker")   | Medium     |
| **budget** | Update **twice**: once at session start, once at session end   | Lowest     |

---

## 4. File Format (Creating New)

Use this structure when creating `session-tracker.md` for the first time:

### Full Tracking (`tracking_start: "full"`)

````markdown
---
title: "Project name or description"
repository: "owner/repo-name"
version_control: "git_remote"
status: "in_progress"
tracking_start: "full"
created_at: "2026-03-28T10:00:00Z"
updated_at: "2026-03-28T11:30:00Z"
current_session: "session_abc123"
current_branch: "feature/auth"
agent_model: "claude-opus-4-6"
update_mode: "manual"
tags: ["backend", "auth"]
progress: 30
---

## Objective
The overall goal of this project.

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
### [2026-03-28 10:00:00] Session started — session_abc123 (feature/auth)
Beginning work on user authentication.

### [2026-03-28 10:30:00] Completed: JWT utility
Created sign/verify functions using RS256.

### [2026-03-28 11:30:00] Session paused — session_abc123
Stopping for now. Login endpoint is next.

## Notes
Next session should pick up the login endpoint work.
````

### Mid-Project Tracking (`tracking_start: "mid_project"`)

````markdown
---
title: "E-commerce Platform"
repository: "owner/repo-name"
version_control: "git_remote"
status: "in_progress"
tracking_start: "mid_project"
created_at: "2026-03-28T14:00:00Z"
updated_at: "2026-03-28T16:30:00Z"
current_session: "session_xyz789"
current_branch: "feature/payments"
agent_model: "claude-opus-4-6"
update_mode: "manual"
tags: ["e-commerce", "backend"]
progress: 65
---

## Objective
Full-stack e-commerce platform — currently adding payment processing.

## Project Summary
> Summarizes project state when tracking began. Activity log only covers work from this point forward.

- **What this project is:** E-commerce platform with Next.js frontend and Express API
- **What's been done:** User auth, product catalog, shopping cart, admin dashboard (all complete)
- **Current state:** Core platform functional. Payment processing is the main remaining feature.
- **Tech stack:** Next.js 14, Express, PostgreSQL, Redis, Stripe

## Tasks
- [x] User authentication and accounts
- [x] Product catalog and search
- [x] Shopping cart
- [x] Admin dashboard
- [ ] Integrate Stripe payment processing
- [ ] Add webhook handlers for payment events
- [ ] Write payment flow tests

## Changes Made
### Session: session_xyz789 (feature/payments) — 2026-03-28
- `src/payments/stripe.ts` — New Stripe integration service

## Key Decisions
- Using Stripe Payment Intents API over Checkout Sessions for more control

## Blockers
_None._

## Activity Log
### [2026-03-28 14:00:00] Tracking started (mid-project) — session_xyz789 (feature/payments)
Joined existing e-commerce project. Payment processing is the current priority.

### [2026-03-28 15:45:00] In progress: Stripe integration
Building payment service with Payment Intents API.

### [2026-03-28 16:30:00] Session paused — session_xyz789
Stripe service partially complete. Webhook handlers next.

## Notes
Payment integration underway. Next session should finish webhooks and add tests.
````

---

## 5. Continuing an Existing File

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

### Key Decisions
- **Append** new decisions below existing ones
- Do not remove previous decisions

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

### Notes
- **Replace** with current notes (this section is always up-to-date, not cumulative)

---

## 6. Field Reference

| Field             | Required | Values / Format                                                  |
|-------------------|----------|------------------------------------------------------------------|
| `title`           | Yes      | Project name or description (under 60 chars)                     |
| `repository`      | Yes      | Repository in `owner/repo` format                                |
| `version_control`  | No       | `git_remote` · `git_local` · `none` — auto-detected by agent    |
| `status`          | Yes      | `not_started` · `in_progress` · `blocked` · `completed` · `failed` |
| `tracking_start`  | Yes      | `full` · `mid_project` — set once, never change                  |
| `created_at`      | Yes      | ISO 8601 — when tracking file was first created                  |
| `updated_at`      | Yes      | ISO 8601 — **update every time you edit the file**               |
| `current_session` | Yes      | Session ID of the most recent / active session                   |
| `current_branch`  | Yes      | Git branch the current session is working on                     |
| `agent_model`     | Yes      | Model of current session (e.g., `claude-opus-4-6`)              |
| `update_mode`     | Yes      | `auto` · `manual` · `budget`                                    |
| `tags`            | Yes      | Array of keyword tags                                            |
| `progress`        | Yes      | Integer `0`–`100`                                                |

---

## 7. Activity Log Format

Each entry follows this format:

```markdown
### [YYYY-MM-DD HH:MM:SS] Short descriptive title
Optional details about what was done, found, or decided.
```

### Entry Title Conventions

**Session boundaries (always include session ID and branch):**
- `Session started — session_abc123 (feature/auth)` — opening entry
- `Tracking started (mid-project) — session_abc123 (feature/auth)` — first entry for mid_project
- `Session paused — session_abc123` — stopping but not done
- `Session completed — session_abc123` — all work for this session is done

**Work entries:**
- `Completed: <task name>` — when a task is finished
- `In progress: <task name>` — when starting new work
- `Blocked: <reason>` — when hitting a blocker
- `Decision: <summary>` — when making a key choice

### Rules per Update Mode

| Mode       | What to Log                                                           |
|------------|-----------------------------------------------------------------------|
| **auto**   | One entry per prompt/response. Include what was done and key findings |
| **manual** | Batch recent work into summary entries when updating                  |
| **budget** | Two entries only: session start and session end                       |

---

## 8. When to Update

### Auto Mode
| When                            | What to Do                                                    |
|---------------------------------|---------------------------------------------------------------|
| **Session start**               | Read existing file (or create new). Add session start log entry |
| **After each prompt/response**  | Update `updated_at`, `progress`, check off tasks, add log entry |
| **On status change**            | Update `status` immediately                                   |
| **Session end**                 | Final update with session end log entry                       |

### Manual Mode
| When                            | What to Do                                                    |
|---------------------------------|---------------------------------------------------------------|
| **Session start**               | Read existing file (or create new). Add session start log entry |
| **When user asks**              | Full update: tasks, progress, changes, activity log           |
| **Session end**                 | Final update with session end log entry                       |

### Budget Mode
| When                            | What to Do                                                    |
|---------------------------------|---------------------------------------------------------------|
| **Session start**               | Read existing file (or create new). Add session start log entry |
| **Session end**                 | One comprehensive update with session end log entry           |

---

## 9. Status & Progress

### Status Guide

| Status         | When to Use                                                |
|----------------|------------------------------------------------------------|
| `not_started`  | File created but no real work done yet                     |
| `in_progress`  | Actively working and making progress                       |
| `blocked`      | Cannot continue — waiting on dependency or issue           |
| `completed`    | All tasks finished successfully                            |
| `failed`       | Session ended due to unrecoverable errors                  |

### Progress Scale

| Range     | Meaning                                      |
|-----------|----------------------------------------------|
| `0–10`    | Just started, reading and understanding       |
| `20–40`   | Initial implementation underway               |
| `50–70`   | Core work done, working on remaining tasks    |
| `80–90`   | Nearly done, final testing and polish         |
| `100`     | All tasks complete                            |

---

## 8. Tech Stack File (`tech-stack.md`)

When the user requests it, create or update `tech-stack.md` in the same `.claude/sessions/` folder. This file gives the dashboard (and future sessions) a quick overview of the project's technical landscape.

**Format:**
```markdown
# Tech Stack

> Last updated: 2026-03-28 14:00:00

## Stack
- **Language:** TypeScript
- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Frontend:** React 19, Tailwind CSS
- **Auth:** JWT (RS256)
- **Testing:** Vitest
- **Deployment:** Docker, AWS ECS

## Project Structure
```
src/
├── routes/       # API endpoints
├── services/     # Business logic
├── models/       # Prisma models
├── middleware/    # Auth, validation
└── utils/        # Shared helpers
```

## Core Features
- User authentication (JWT)
- Product catalog with search
- Shopping cart and checkout

## Recent Changes
### [2026-03-28 14:00:00] Added PostgreSQL
Migrated from SQLite to PostgreSQL for production readiness.
```

**Rules:**
- **Only create when the user asks** — don't auto-create this file
- **Keep it concise** — this is a quick reference, not documentation
- **Update the "Recent Changes" section** when a decision affects the stack or structure (e.g. adding a database, switching frameworks, major refactors)
- **For mid-project tracking**, write down what you can determine from a quick scan — don't deep-dive
- **Always update `Last updated` timestamp** when editing

---

## 10. Rules

1. **One file per project: `session-tracker.md`** — all sessions share this file
2. **Always read the existing file first** — never overwrite, always update
3. **Never remove previous session data** — activity logs and changes are cumulative
4. **Always update `updated_at`** to current time on every edit
5. **Always add session boundary entries** in the activity log (start + end)
6. **Be honest about `progress`** — reflect actual completion, not time spent
7. **Be specific in Tasks** — vague tasks are useless
8. **Log timestamps accurately** — use the actual current time
9. **Include all file changes** under your session's sub-heading in Changes Made
10. **Write Notes for handoff** — the next session reads this to understand what to do
11. **Respect the update mode** — don't waste tokens in budget mode
12. **Create `.claude/sessions/` directory** if it doesn't exist
13. **Set `tracking_start` once** — never change it after the file is created
14. **Don't over-read for mid-project summaries** — quick scan only
15. **Read `notes.md` at session start** if it exists — it contains user instructions and context
16. **Never modify `notes.md`** — it is user-maintained from the dashboard
17. **Write agent notes to `agent-notes.md`** — use this to communicate with the user or the next session
18. **Set `version_control`** — check if the project has git (`git rev-parse --is-inside-work-tree`), and if it has a remote (`git remote -v`). Set to `git_remote` if remotes exist, `git_local` if git but no remote, `none` if no git.

### Agent Notes (`agent-notes.md`)

Agents can leave notes for the user and future sessions by writing to `agent-notes.md` in the same `.claude/sessions/` folder. This keeps agent notes separate from user notes (`notes.md`).

**Format** — append entries using this exact format:
```markdown
### [YYYY-MM-DD HH:MM:SS] Agent
Your note here. Can be multiple lines.

```

**When to write agent notes:**
- Decisions that need user review ("Chose PostgreSQL over SQLite because...")
- Warnings or blockers ("API rate limit is close, consider upgrading plan")
- Handoff context for the next session ("Auth module is half-done, start with `src/auth/`")
- Questions for the user ("Should we add rate limiting to the public API?")

**Rules:**
- **NEVER modify `notes.md`** — that file belongs to the user
- **Always append** to `agent-notes.md` — never overwrite previous entries
- **Use accurate timestamps** — use the actual current time
- **Create the file** if it doesn't exist, with the header `# Agent Notes` followed by a blank line before the first entry

---

## Quick Start

Copy-paste one of these to tell an agent what to do:

**New project:**
> Read `claude-session-track.md` and follow its instructions. This is a new project — use `tracking_start: "full"`. Use **manual** mode.

**Existing project (first time tracking):**
> Read `claude-session-track.md` and follow its instructions. This project has existing work — use `tracking_start: "mid_project"`. Use **manual** mode.

**Continuing (tracking file already exists):**
> Read `claude-session-track.md` and follow its instructions. The tracking file already exists at `.claude/sessions/session-tracker.md` — read it and continue from where the last session left off. Use **manual** mode.
