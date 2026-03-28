---
title: "Claude Session Tracker"
repository: "wzgDamitha/claude-project-tracker"
status: "in_progress"
tracking_start: "full"
created_at: "2026-03-28T09:00:00Z"
updated_at: "2026-03-28T14:30:00Z"
current_session: "session_015WXoyPeSg5LLXjwMqzqnYM"
current_branch: "claude/session-tracking-webapp-6euEH"
agent_model: "claude-opus-4-6"
update_mode: "manual"
tags: ["dashboard", "tracking", "node", "express"]
progress: 80
---

## Objective
Build a local web app to track Claude Code session progress across multiple projects.

## Tasks
- [x] Express server with session file parser
- [x] Dark-themed dashboard with cards grid
- [x] Status filters and detail modal
- [x] SSE live reload on file changes
- [x] First-run setup wizard
- [x] Multi-folder config (shared + individual modes)
- [x] Settings panel with add/remove folders
- [x] Activity log with timestamped entries
- [x] Three update modes (auto/manual/budget)
- [x] Project auto-discovery from root folder
- [x] Strict session file naming (session-* pattern)
- [x] Mid-project tracking support
- [x] Single file per project (session-tracker.md)
- [ ] Real-world testing across multiple projects
- [ ] Documentation and README

## Changes Made
### Session: session_abc123 (claude/session-tracking-webapp-6euEH) — 2026-03-28
- `server/index.js` — Express server with session parser and SSE
- `server/config.js` — Config management module
- `public/index.html` — Dashboard HTML with wizard and modals
- `public/styles.css` — Full dark theme styles
- `public/app.js` — Frontend logic, wizard, settings, filters
- `claude-session-track.md` — Agent instruction file
- `SESSION_TEMPLATE.md` — Template reference

### Session: session_015WXoyPeSg5LLXjwMqzqnYM (claude/session-tracking-webapp-6euEH) — 2026-03-28
- `server/index.js` — Added discover API, session file filter, session history parsing
- `server/config.js` — Added discoverRoot to config
- `public/app.js` — Discover UI, mid-project notices, session history timeline
- `public/styles.css` — Discover list, tracking badges, session boundary styles
- `claude-session-track.md` — Rewrote for single-file-per-project model

## Key Decisions
- One tracking file per project (`session-tracker.md`) shared across all sessions
- Three update modes to control token usage
- Mid-project tracking for existing projects (quick scan, no deep reads)
- Auto-discover scans for CLAUDE.md to find projects

## Blockers
_None._

## Activity Log
### [2026-03-28 09:00:00] Session started — session_abc123 (claude/session-tracking-webapp-6euEH)
Initial build of the session tracking web app.

### [2026-03-28 09:30:00] Completed: Express server
Built server with markdown parser, gray-matter frontmatter extraction, and SSE live reload.

### [2026-03-28 10:00:00] Completed: Dashboard frontend
Dark-themed card grid with status filters, progress bars, and detail modal.

### [2026-03-28 10:30:00] Completed: Setup wizard
First-run config wizard with shared/individual folder modes.

### [2026-03-28 11:00:00] Session paused — session_abc123
Core app working. Need to add discovery and mid-project support.

### [2026-03-28 12:00:00] Session started — session_015WXoyPeSg5LLXjwMqzqnYM (claude/session-tracking-webapp-6euEH)
Continuing development. Adding project discovery, mid-project tracking, and single-file model.

### [2026-03-28 12:30:00] Completed: Project auto-discovery
API endpoint scans root folder for projects with CLAUDE.md. UI in wizard and settings.

### [2026-03-28 13:00:00] Completed: Mid-project tracking
New tracking_start field. Agents joining late do a quick summary instead of deep history reconstruction.

### [2026-03-28 14:00:00] Completed: Single file per project
Switched from per-session files to one session-tracker.md per project. Sessions append to shared file.

### [2026-03-28 14:30:00] In progress: Testing and polish
Updating examples and testing the full workflow.

## Notes
Next steps: real-world testing across multiple projects, write a proper README. The Quick Start in claude-session-track.md has copy-paste prompts for all three scenarios (new project, existing project, continuing).
