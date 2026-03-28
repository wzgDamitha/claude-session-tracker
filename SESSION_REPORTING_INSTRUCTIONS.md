# Session Reporting Instructions

> **Copy the block below into your project's `CLAUDE.md` file** so that every Claude Code session automatically writes a trackable progress report.

---

## Add This to Your CLAUDE.md

```markdown
## Session Tracking

**IMPORTANT:** At the end of every session, you MUST write a session report file.

### Instructions

1. Create a markdown file at: `.claude/sessions/<session-id>.md`
   - Use your session ID from the URL (e.g., `session_015WXoyPeSg5LLXjwMqzqnYM.md`)
   - If you don't know your session ID, use a descriptive name like `session-fix-login-bug.md`

2. Use this exact format with YAML frontmatter:

---

\```yaml
session_id: "session_015WXoyPeSg5LLXjwMqzqnYM"
title: "Short description of what you worked on"
branch: "feature/your-branch-name"
status: "in_progress"
started_at: "2026-03-28T10:00:00Z"
updated_at: "2026-03-28T11:30:00Z"
agent_model: "claude-opus-4-6"
repository: "owner/repo-name"
tags: ["relevant", "tags", "here"]
progress: 50
\```

### Field Reference

| Field          | Required | Description                                                     |
|----------------|----------|-----------------------------------------------------------------|
| `session_id`   | Yes      | Your session ID or a unique identifier                          |
| `title`        | Yes      | Brief title describing the work (shown as card title)           |
| `branch`       | Yes      | Git branch you're working on                                    |
| `status`       | Yes      | One of: `not_started`, `in_progress`, `blocked`, `completed`, `failed` |
| `started_at`   | Yes      | ISO 8601 timestamp when session started                         |
| `updated_at`   | Yes      | ISO 8601 timestamp of last update (use current time)            |
| `agent_model`  | No       | Model used (e.g., `claude-opus-4-6`, `claude-sonnet-4-6`)      |
| `repository`   | No       | Repository in `owner/repo` format                               |
| `tags`         | No       | Array of keyword tags for filtering                             |
| `progress`     | Yes      | Integer 0-100 representing completion percentage                |

### Required Sections (after frontmatter)

Write these sections using markdown:

**## Objective**
One or two sentences explaining what this session is trying to accomplish.

**## Tasks**
Use checkbox format. Check off completed items:
- `- [x] Completed task`
- `- [ ] Pending task`

**## Changes Made**
List files modified with brief descriptions:
- `path/to/file.ts` — What was changed and why

**## Key Decisions**
Bullet points of any architectural or design decisions made during the session.

**## Blockers**
List anything blocking progress, or write `_None._` if clear.

**## Notes**
Any additional context, next steps, or handoff notes for the next session.

### Status Guide

| Status         | When to Use                                          |
|----------------|------------------------------------------------------|
| `not_started`  | Session created but no work done yet                 |
| `in_progress`  | Actively working, making progress                    |
| `blocked`      | Cannot continue due to external dependency or issue  |
| `completed`    | All tasks finished successfully                      |
| `failed`       | Session ended without completing due to errors       |

### Progress Estimation

- **0-10%**: Just started, understanding the problem
- **20-40%**: Initial implementation underway
- **50-70%**: Core work done, finishing up remaining tasks
- **80-90%**: Almost done, final testing/polish
- **100%**: All tasks complete

### Example

\```markdown
---
session_id: "session_015WXoyPeSg5LLXjwMqzqnYM"
title: "Add email notification service"
branch: "feature/email-notifications"
status: "in_progress"
started_at: "2026-03-28T09:00:00Z"
updated_at: "2026-03-28T12:30:00Z"
agent_model: "claude-opus-4-6"
repository: "acme/backend-api"
tags: ["email", "notifications", "backend"]
progress: 70
---

## Objective
Build an email notification service that sends transactional emails (welcome, password reset, order confirmation) using SendGrid.

## Tasks
- [x] Created EmailService class with SendGrid integration
- [x] Added email templates for welcome and password reset
- [x] Created /api/notifications/send endpoint
- [x] Added rate limiting (10 emails/min per user)
- [ ] Add order confirmation template
- [ ] Write unit tests for EmailService
- [ ] Add retry logic for failed sends

## Changes Made
- `src/services/EmailService.ts` — New service class wrapping SendGrid SDK
- `src/templates/welcome.html` — Welcome email HTML template
- `src/templates/password-reset.html` — Password reset email template
- `src/routes/notifications.ts` — New notification endpoints
- `src/middleware/rateLimit.ts` — Updated with email-specific limiter

## Key Decisions
- Using SendGrid over AWS SES for simpler template management
- Rate limit set to 10/min per user to prevent abuse
- HTML templates stored as files rather than in database

## Blockers
_None._

## Notes
Core sending logic works. Need to finish the order confirmation template and add tests. The retry logic should use exponential backoff with max 3 attempts.
\```

### Important Reminders
- **Always update the file** if you resume work in the same session — don't create duplicates
- **Set `updated_at`** to the current time whenever you update the file
- **Update `progress`** to reflect actual completion, not just time spent
- **Be specific in Tasks** — use granular checkboxes so progress is clearly visible
- **Be honest about Blockers** — this helps other sessions and team members understand dependencies
```
