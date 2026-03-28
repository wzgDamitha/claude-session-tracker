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

## 2. New Session vs Existing Project

Before writing your report, determine if you are **starting fresh** or **joining a project already in progress**.

### How to Decide

| Situation | `tracking_start` value |
|-----------|------------------------|
| This is a brand-new task/feature with no prior work | `full` |
| The project existed before tracking was added — there is significant prior work you didn't do | `mid_project` |
| You're continuing a session that already has a tracking file | Keep the existing value |

> **If unsure, default to `mid_project`.** It's better to summarize than to waste tokens reconstructing history.

### If `tracking_start: "mid_project"`

**DO NOT** try to read the entire codebase or git history to reconstruct a detailed activity log. That wastes tokens and produces inaccurate results. Instead:

1. **Do a quick scan** — look at the project structure, recent git log (last 5–10 commits), and any README/docs to understand the current state
2. **Write a `## Project Summary` section** (replaces detailed Activity Log history) summarizing:
   - What the project is
   - What has been done so far (high-level bullet points)
   - Current state of the codebase
3. **List tasks as you understand them** — check off what appears done, leave pending items unchecked
4. **Start logging normally from this point forward** — all new activity log entries are timestamped as usual

### If `tracking_start: "full"`

You are tracking from the beginning. Log everything as described in the Activity Log section below.

---

## 3. Update Mode

The user will tell you which update mode to use. **If they don't specify, default to `manual`.**

| Mode       | What You Do                                                    | Token Cost |
|------------|----------------------------------------------------------------|------------|
| **auto**   | Update the report after **every prompt/response** cycle        | Higher     |
| **manual** | Update **only** when the user asks (e.g., "update tracker")   | Medium     |
| **budget** | Update **twice**: once at session start, once at session end   | Lowest     |

---

## 4. Filename

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

## 5. File Format

### Full Tracking (`tracking_start: "full"`)

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
tracking_start: "full"
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

### Mid-Project Tracking (`tracking_start: "mid_project"`)

````markdown
---
session_id: "your-session-id"
title: "Continue work on e-commerce platform"
branch: "main"
status: "in_progress"
started_at: "2026-03-28T14:00:00Z"
updated_at: "2026-03-28T16:30:00Z"
agent_model: "claude-opus-4-6"
repository: "owner/repo-name"
update_mode: "manual"
tracking_start: "mid_project"
tags: ["e-commerce", "backend"]
progress: 65
---

## Objective
Adding payment processing integration to the existing e-commerce platform.

## Project Summary
> This section summarizes the state of the project when tracking began.
> The activity log below only covers work done from this point forward.

- **What this project is:** Full-stack e-commerce platform with Next.js frontend and Express API
- **What's been done:**
  - User auth and account management (complete)
  - Product catalog with search and filtering (complete)
  - Shopping cart with persistent state (complete)
  - Order management system (partial — missing payment integration)
  - Admin dashboard (complete)
- **Current state:** Core platform is functional. Payment processing is the main remaining feature before launch. Checkout flow exists but uses mock payment data.
- **Tech stack:** Next.js 14, Express, PostgreSQL, Redis, Stripe SDK installed but not integrated

## Tasks
- [x] User authentication and accounts
- [x] Product catalog and search
- [x] Shopping cart
- [x] Admin dashboard
- [ ] Integrate Stripe payment processing
- [ ] Add webhook handlers for payment events
- [ ] Write payment flow tests
- [ ] Deploy to staging

## Changes Made
- `src/payments/stripe.ts` — New Stripe integration service (in progress)

## Key Decisions
- Using Stripe Payment Intents API over Checkout Sessions for more control

## Blockers
_None._

## Activity Log
### [2026-03-28 14:00:00] Tracking started (mid-project)
Joined existing e-commerce project. Payment processing is the current priority.

### [2026-03-28 14:20:00] Completed: Review payment requirements
Reviewed checkout flow in `src/pages/checkout.tsx`. Currently uses mock data. Stripe SDK already in package.json.

### [2026-03-28 15:45:00] In progress: Stripe integration
Building `src/payments/stripe.ts` with Payment Intents API.

## Notes
Project is well-structured. Payment integration should be straightforward.
````

---

## 6. Field Reference

| Field             | Required | Values / Format                                                  |
|-------------------|----------|------------------------------------------------------------------|
| `session_id`      | Yes      | Your session ID or a unique identifier                           |
| `title`           | Yes      | Brief title for dashboard card (under 60 chars)                  |
| `branch`          | Yes      | Git branch you're working on                                     |
| `status`          | Yes      | `not_started` · `in_progress` · `blocked` · `completed` · `failed` |
| `started_at`      | Yes      | ISO 8601 timestamp when session started                          |
| `updated_at`      | Yes      | ISO 8601 timestamp — **update this every time you edit the file** |
| `agent_model`     | Yes      | Model you're running as (e.g., `claude-opus-4-6`)               |
| `repository`      | Yes      | Repository in `owner/repo` format                                |
| `update_mode`     | Yes      | `auto` · `manual` · `budget`                                    |
| `tracking_start`  | Yes      | `full` · `mid_project`                                          |
| `tags`            | Yes      | Array of keyword tags (e.g., `["backend", "auth", "bugfix"]`)   |
| `progress`        | Yes      | Integer `0`–`100` representing completion percentage             |

---

## 7. Required Sections

### Always Required

#### `## Objective`
1–2 sentences. What is the goal of this session?

#### `## Tasks`
Checkbox list of work items. Use `- [x]` for done and `- [ ]` for pending.
- Be granular — each meaningful step gets its own checkbox
- Order: completed tasks first, then pending
- For `mid_project`: include pre-existing completed work as checked items (high-level, don't over-detail)

#### `## Changes Made`
Every file **you** created, modified, or deleted in this session:
- Format: `` `path/to/file.ext` `` — brief description of what changed
- **Only include changes you made**, not prior work

#### `## Key Decisions`
Any architectural, design, or trade-off decisions. Include the *why*, not just the *what*.
- If no decisions were made, write `_None._`

#### `## Blockers`
Anything preventing progress, with enough detail for someone else to understand.
- If no blockers, write `_None._`

#### `## Activity Log`
Timestamped record of what happened. See section 8 for format details.

#### `## Notes`
Handoff context: next steps, things to watch out for, suggestions for the next session.

### Mid-Project Only

#### `## Project Summary`
**Required when `tracking_start: "mid_project"`.** Place this after Objective, before Tasks.

This section tells the dashboard (and future agents) what the project state was when tracking began. Include:

- **What this project is** — one-line description
- **What's been done** — high-level bullet points of completed work (do NOT read every file — just scan the structure and recent git log)
- **Current state** — where things stand right now
- **Tech stack** — key technologies (optional but helpful)

> Keep this lightweight. Spend no more than a quick scan of the project structure and `git log --oneline -15`. Do NOT read every file to build this summary.

---

## 8. Activity Log Format

Timestamped record of what happened during the session.

Each entry:
```markdown
### [YYYY-MM-DD HH:MM:SS] Short descriptive title
Optional details about what was done, found, or decided.
Can be multiple lines if needed.
```

**Entry title conventions:**
- `Session started` — first entry for `full` tracking
- `Tracking started (mid-project)` — first entry for `mid_project` tracking
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
| **budget** | Two entries only: start entry and end entry                           |

**For `mid_project`:** The first log entry should always be `Tracking started (mid-project)` — do NOT backfill historical entries. All entries before that point are captured in the Project Summary section instead.

---

## 9. When to Write / Update

### Auto Mode
| When                        | What to Do                                                        |
|-----------------------------|-------------------------------------------------------------------|
| **Session start**           | Create the file. Status `in_progress`, progress estimate, first log entry |
| **After each prompt/response** | Update `updated_at`, `progress`, check off tasks, add log entry |
| **On status change**        | Update `status` immediately (e.g., when blocked)                  |
| **Session end**             | Final update with accurate status, progress, and closing log entry |

### Manual Mode
| When                        | What to Do                                                        |
|-----------------------------|-------------------------------------------------------------------|
| **Session start**           | Create the file. Status `in_progress`, progress estimate          |
| **When user asks**          | Full update: tasks, progress, changes, activity log               |
| **Session end**             | Final update with accurate status and progress                    |

### Budget Mode
| When                        | What to Do                                                        |
|-----------------------------|-------------------------------------------------------------------|
| **Session start**           | Create the file with basic info, progress estimate, one log entry |
| **Session end**             | One comprehensive update: all tasks, changes, decisions, final log |

> **Note for `mid_project`:** When estimating initial `progress`, base it on how many tasks appear done vs remaining. Don't set it to `0` if the project is already 60% complete.

---

## 10. Status Guide

| Status         | When to Use                                                |
|----------------|------------------------------------------------------------|
| `not_started`  | File created but no real work done yet                     |
| `in_progress`  | Actively working and making progress                       |
| `blocked`      | Cannot continue — waiting on dependency or issue           |
| `completed`    | All tasks finished successfully                            |
| `failed`       | Session ended due to unrecoverable errors                  |

---

## 11. Progress Scale

| Range     | Meaning                                      |
|-----------|----------------------------------------------|
| `0–10`    | Just started, reading and understanding       |
| `20–40`   | Initial implementation underway               |
| `50–70`   | Core work done, working on remaining tasks    |
| `80–90`   | Nearly done, final testing and polish         |
| `100`     | All tasks complete                            |

> For `mid_project`: set initial progress based on what's already done. If 4 of 8 tasks are complete, start at ~50.

---

## 12. Rules

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
11. **Don't over-read for mid-project summaries** — a quick scan is enough, don't burn tokens reading every file
12. **Set `tracking_start` accurately** — this tells the dashboard whether the history is complete or partial

---

## Quick Start

Copy-paste one of these to tell an agent what to do:

**New project (full tracking):**
> Read the file `claude-session-track.md` and follow its instructions. This is a new project — use `tracking_start: "full"`. Write to `.claude/sessions/`. Use **manual** mode.

**Existing project (joining mid-way):**
> Read the file `claude-session-track.md` and follow its instructions. This project has existing work — use `tracking_start: "mid_project"`. Write to `.claude/sessions/`. Use **manual** mode.
