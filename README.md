# Claude Session Tracker

A free, open-source local web dashboard that tracks Claude Code session progress across all your projects. One tracking file per project, multiple sessions update it, and you get a live view of everything in one place.

Built with Claude by Damitha from [WebZGarden](https://webzgarden.com)

![Dashboard](https://img.shields.io/badge/localhost-3890-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![License](https://img.shields.io/badge/license-MIT-gray)

## How It Works

```
Your Projects                          Dashboard (localhost:3890)
┌─────────────────────┐
│ project-a/           │               ┌────────────────────────────┐
│  .claude/sessions/   │──────────────▶│ ┌──────┐ ┌──────┐         │
│   session-tracker.md │               │ │!! 65%│ │  100%│  ...    │
│   notes.md           │               │ └──────┘ └──────┘         │
├─────────────────────┤               │                            │
│ project-b/           │──────────────▶│ Grid · List · Timeline    │
│  .claude/sessions/   │               │ Search · Filter · Priority│
│   session-tracker.md │               │ Notes · Activity Log      │
│   notes.md           │               └────────────────────────────┘
└─────────────────────┘
```

1. You tell a Claude Code session to read `claude-session-track.md`
2. The agent writes/updates `.claude/sessions/session-tracker.md` in the project
3. You leave notes from the dashboard — the agent reads them next session
4. The dashboard watches those files and shows live progress

## Quick Start

```bash
git clone https://github.com/wzgDamitha/claude-project-tracker.git
cd claude-project-tracker
npm install
npm start
```

Open **http://localhost:3890** — the setup wizard will guide you through configuration.

### First-Run Setup

On first launch, choose one of two modes:

| Mode | Description |
|------|-------------|
| **Shared Folder** | All sessions write to one central folder |
| **Individual Folders** | Each project has its own `.claude/sessions/` folder (recommended) |

For **Individual Folders**, you can either:
- **Auto-discover** — enter a root folder (e.g., `F:\Future`) and the app scans for projects with `CLAUDE.md`
- **Add manually** — paste specific folder paths

Config is saved to `tracker-config.json` (gitignored, portable between machines).

## Telling Your Agent to Track

Copy-paste one of these into your Claude Code session:

**New project:**
> Read `claude-session-track.md` and follow its instructions. This is a new project — use `tracking_start: "full"`. Use **manual** mode.

**Existing project (first time tracking):**
> Read `claude-session-track.md` and follow its instructions. This project has existing work — use `tracking_start: "mid_project"`. Use **manual** mode.

**Continuing (file already exists):**
> Read `claude-session-track.md` and follow its instructions. The tracking file already exists at `.claude/sessions/session-tracker.md` — read it and continue from where the last session left off. Use **manual** mode.

## Features

### Three Views

| View | Description |
|------|-------------|
| **Grid** | Cards with progress rings, pending tasks, notes preview |
| **List** | Compact table with priority, status, tasks, timestamps |
| **Timeline** | Horizontal bars showing project time spans, color-coded by status |

Switch between views using the toggle buttons in the toolbar.

### Search & Filter

- **Search bar** — instantly filter by project title, tags, branch, or repository
- **Status filters** — All, In Progress, Completed, Blocked, Failed
- All filters work across every view

### Priority

Set priority per project from the detail view: **critical** (`!!!`), **high** (`!!`), **medium** (`!`), **low** (`~`), or **none**.

Projects auto-sort by priority first, then by last updated. Priority badges are visible on cards, list rows, and timeline labels.

### User Notes

Leave notes from the dashboard for the next session to pick up. Notes are saved as `notes.md` alongside `session-tracker.md`.

Use it for:
- Priority changes ("Focus on payments first")
- Context the agent needs ("New Stripe API key in #dev-channel")
- Decisions ("Don't refactor auth yet, waiting on design review")

Agents read `notes.md` at session start and incorporate the context. Notes are append-only and timestamped.

### Full-Screen Detail View

Click any project to open a full-screen detail page with:
- Progress ring with glow effect
- Remaining tasks shown at the top (not buried at the bottom)
- Handoff notes prominently displayed
- User notes with comment thread
- Session history chips
- Activity timeline with session boundary markers
- Full rendered markdown content

### One File Per Project

Every project has a single file: `.claude/sessions/session-tracker.md`

Multiple sessions update the same file. The dashboard tracks:
- Which sessions contributed (session history chips)
- Session boundaries in the activity timeline (highlighted markers)
- Current active session and branch

### Multi-Project Support

- Watch multiple project folders simultaneously
- Each card shows which project it belongs to
- **Auto-discover** projects by scanning a root folder for `CLAUDE.md`
- Add/remove projects anytime via Settings
- Configurable layout max-width (100% full width or fixed like 1400px)

### Update Modes

Control how often the agent updates the tracking file:

| Mode | Behavior | Token Cost |
|------|----------|------------|
| **auto** | Updates after every prompt/response | Higher |
| **manual** | Updates only when you ask | Medium |
| **budget** | Updates at start + end only | Lowest |

### New vs Existing Projects

| `tracking_start` | Behavior |
|-------------------|----------|
| `full` | Tracks everything from the beginning — complete activity log |
| `mid_project` | Agent does a quick scan, writes a Project Summary of prior work, then logs normally. No token-expensive deep history reconstruction. |

The dashboard visually distinguishes these with badges: **full** (green) vs **mid-project** (yellow).

### Live Reload

The dashboard auto-updates when session files change — no manual refresh needed. Powered by Server-Sent Events watching all configured folders.

## Project Structure

```
claude-project-tracker/
├── server/
│   ├── index.js              // Express server, API, SSE, file watcher
│   └── config.js             // Config load/save/validate
├── public/
│   ├── index.html            // Dashboard HTML + setup wizard
│   ├── app.js                // Frontend logic
│   └── styles.css            // WZG-inspired dark theme
├── claude-session-track.md   // Agent instruction file (share this)
├── SESSION_TEMPLATE.md       // Quick reference template
├── tracker-config.json       // Generated on first run (gitignored)
└── package.json
```

## Configuration

### `tracker-config.json`

Generated on first run. Edit directly or use the Settings UI.

```json
{
  "mode": "individual",
  "sharedFolder": "",
  "watchFolders": [
    "C:\\Projects\\my-app\\.claude\\sessions",
    "C:\\Projects\\api-server\\.claude\\sessions"
  ],
  "discoverRoot": "C:\\Projects",
  "maxWidth": "100%",
  "port": 3890
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3890` | Server port |
| `SESSIONS_DIR` | — | Override: watch a single folder (bypasses config) |

## Tracking File Format

Each project's `session-tracker.md` uses YAML frontmatter + markdown:

```yaml
---
title: "My Project"
repository: "owner/repo"
status: "in_progress"
priority: "high"
tracking_start: "full"
created_at: "2026-03-28T10:00:00Z"
updated_at: "2026-03-28T14:00:00Z"
current_session: "session_abc123"
current_branch: "feature/auth"
agent_model: "claude-opus-4-6"
update_mode: "manual"
tags: ["backend", "auth"]
progress: 65
---
```

Sections: Objective, Project Summary (mid-project only), Tasks, Changes Made (grouped by session), Key Decisions, Blockers, Activity Log (timestamped with session boundaries), Notes.

See [`claude-session-track.md`](claude-session-track.md) for the complete agent instruction specification.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | GET | All sessions from all watched folders |
| `/api/sessions/:file` | GET | Single session (optional `?source=` folder) |
| `/api/sessions/:file` | PATCH | Update session frontmatter (priority, etc.) |
| `/api/config` | GET | Current configuration |
| `/api/config` | POST | Save configuration |
| `/api/config/folders` | POST | Add a watch folder |
| `/api/config/folders` | DELETE | Remove a watch folder |
| `/api/discover?root=` | GET | Scan folder for projects with CLAUDE.md |
| `/api/notes?source=` | GET | Get user notes for a project |
| `/api/notes?source=` | POST | Add a user note |
| `/api/events` | GET | SSE stream for live reload |

## Development

```bash
npm run dev    # Starts with --watch for auto-restart on server changes
```

This is a free, open-source tool. Fork it, modify it, connect your own notification services, or extend it however you like.

## Design

UI design inspired by the [WZG Design System](https://webzgarden.com) by WebZGarden.

## License

MIT
