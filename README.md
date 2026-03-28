# Claude Session Tracker

A local web dashboard that tracks Claude Code session progress across your projects. Each project maintains a single tracking file (`session-tracker.md`) that every session reads and updates — giving you a live, aggregated view of what's happening across all your Claude Code work.

![Dashboard](https://img.shields.io/badge/localhost-3890-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![License](https://img.shields.io/badge/license-MIT-gray)

## How It Works

```
Your Projects                          Dashboard (localhost:3890)
┌─────────────────────┐
│ project-a/           │                ┌──────────────────────┐
│  .claude/sessions/   │───────────────▶│  ┌────┐ ┌────┐      │
│   session-tracker.md │                │  │ 65%│ │100%│ ...  │
├─────────────────────┤                │  └────┘ └────┘      │
│ project-b/           │───────────────▶│  Progress, tasks,    │
│  .claude/sessions/   │                │  activity timeline,  │
│   session-tracker.md │                │  session history     │
└─────────────────────┘                └──────────────────────┘
```

1. You tell a Claude Code session to read `claude-session-track.md`
2. The agent writes/updates `.claude/sessions/session-tracker.md` in the project
3. The dashboard watches those files and shows live progress

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

### Dashboard
- **Session cards** with status badges, progress bars, task counts, and tags
- **Status filters** — All, In Progress, Completed, Blocked, Failed
- **Detail modal** with full rendered markdown, progress ring, and activity timeline
- **Live reload** — dashboard auto-updates when files change (via SSE)

### Multi-Project Support
- Watch multiple project folders simultaneously
- Each card shows which project it belongs to
- **Auto-discover** projects by scanning a root folder for `CLAUDE.md`
- Add/remove projects anytime via Settings (gear icon)

### One File Per Project
Every project has a single file: `.claude/sessions/session-tracker.md`

Multiple sessions update the same file. The dashboard tracks:
- Which sessions contributed (session history chips)
- Session boundaries in the activity timeline (highlighted yellow)
- Current active session and branch

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
| `mid_project` | Agent does a quick scan, writes a Project Summary of prior work, then logs normally. No token-expensive history reconstruction. |

The dashboard visually distinguishes these with badges: **full history** (green) vs **mid-project** (yellow).

## Project Structure

```
claude-project-tracker/
├── server/
│   ├── index.js          # Express server, API, SSE, file watcher
│   └── config.js         # Config load/save/validate
├── public/
│   ├── index.html        # Dashboard HTML + setup wizard
│   ├── app.js            # Frontend logic
│   └── styles.css        # Dark theme styles
├── claude-session-track.md   # Agent instruction file (share this)
├── SESSION_TEMPLATE.md       # Quick reference template
├── tracker-config.json       # Generated on first run (gitignored)
└── package.json
```

## Configuration

### `tracker-config.json`

Generated on first run. You can edit it directly or use the Settings UI.

```json
{
  "mode": "individual",
  "sharedFolder": "",
  "watchFolders": [
    "C:\\Projects\\my-app\\.claude\\sessions",
    "C:\\Projects\\api-server\\.claude\\sessions"
  ],
  "discoverRoot": "C:\\Projects",
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

Sections: Objective, Tasks (checkboxes), Changes Made (grouped by session), Key Decisions, Blockers, Activity Log (timestamped with session boundaries), Notes.

See [`claude-session-track.md`](claude-session-track.md) for the complete specification.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | GET | All sessions from all watched folders |
| `/api/sessions/:file` | GET | Single session (optional `?source=` folder) |
| `/api/config` | GET | Current configuration |
| `/api/config` | POST | Save configuration |
| `/api/config/folders` | POST | Add a watch folder |
| `/api/config/folders` | DELETE | Remove a watch folder |
| `/api/discover?root=` | GET | Scan folder for projects with CLAUDE.md |
| `/api/events` | GET | SSE stream for live reload |

## Development

```bash
npm run dev    # Starts with --watch for auto-restart on server changes
```

## Design

UI design inspired by the [WZG Design System](https://webzgarden.com) by WebZ Garden.

## License

MIT
