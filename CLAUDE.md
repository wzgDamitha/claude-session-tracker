# Claude Session Tracker

## Session Reporting

Before ending your session, write a detailed session report to `.claude/sessions/<session-id>.md`.

Use the frontmatter format from `SESSION_TEMPLATE.md` with these required fields:
- `session_id`, `title`, `branch`, `status` (not_started|in_progress|blocked|completed|failed)
- `started_at`, `updated_at` (ISO 8601), `progress` (0-100)
- `tags` (array of keywords)

Include sections: Objective, Tasks (with checkboxes), Changes Made, Key Decisions, Blockers, Notes.

## Running the Tracker

```bash
npm install
npm start        # http://localhost:3890
```

Set `SESSIONS_DIR` env var to point to a custom sessions directory if needed.
