# Claude Session Tracker

A free, open-source local web dashboard that tracks Claude Code session progress across all your projects. One tracking file per project, multiple sessions update it, and you get a live view of everything in one place.

Built with Claude by Damitha from [WebZGarden](https://webzgarden.com)

![Dashboard](https://img.shields.io/badge/localhost-3890-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![License](https://img.shields.io/badge/license-MIT-gray)

## Quick Start

```bash
git clone https://github.com/wzgDamitha/claude-session-tracker.git
cd claude-session-tracker
npm install
npm start
```

Open **http://localhost:3890** — the setup wizard will guide you through configuration.

## Telling Your Agent to Track

Copy-paste one of these into your Claude Code session:

**New project:**
> Read `claude-session-track.md` and follow its instructions. This is a new project — use `tracking_start: "full"`. Use **manual** mode.

**Existing project (first time tracking):**
> Read `claude-session-track.md` and follow its instructions. This project has existing work — use `tracking_start: "mid_project"`. Use **manual** mode.

**Continuing (file already exists):**
> Read `claude-session-track.md` and follow its instructions. The tracking file already exists at `.claude/sessions/session-tracker.md` — read it and continue from where the last session left off. Use **manual** mode.

## How It Works

```
Your Projects                          Dashboard (localhost:3890)
┌─────────────────────┐
│ project-a/           │               ┌────────────────────────────┐
│  .claude/sessions/   │──────────────▶│ ┌──────┐ ┌──────┐         │
│   session-tracker.md │               │ │!! 65%│ │  100%│  ...    │
│   notes.md           │               │ └──────┘ └──────┘         │
│   agent-notes.md     │               │                            │
├─────────────────────┤               │ Grid · List · Timeline    │
│ project-b/           │──────────────▶│ Search · Filter · Priority│
│  .claude/sessions/   │               │ Notes · Activity Log      │
│   session-tracker.md │               └────────────────────────────┘
│   notes.md           │
│   agent-notes.md     │
└─────────────────────┘
```

1. You tell a Claude Code session to read `claude-session-track.md`
2. The agent writes/updates `.claude/sessions/session-tracker.md` in the project
3. You leave notes from the dashboard — the agent reads them next session
4. The agent leaves notes in `agent-notes.md` — you see them in the dashboard
5. The dashboard watches those files and shows live progress

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

## Update Modes & Token Usage

Control how often the agent updates the tracking file:

| Mode | Behavior | Token Cost |
|------|----------|------------|
| **auto** | Updates after every prompt/response cycle. One activity log entry per interaction — most granular history. | Highest — writes on every turn, adds up in long sessions. |
| **manual** | Updates only when you ask (e.g. "update tracker"). Batches recent work into summary entries. | Medium — **recommended default**. You control when tokens are spent. |
| **budget** | Updates twice per session — start and end only. No intermediate writes. | Lowest — best for tight budgets, less granular tracking. |

Every time the agent writes to the session file it consumes tokens for reading the current state, deciding what to add, and producing the updated content. **manual** is the recommended default. Switch to **budget** for minimal overhead, or **auto** for a detailed per-interaction audit trail.

## Features

### Notes — User & Agent

The dashboard has a unified notes timeline that shows both user and agent notes, each with a distinct badge:

- **User notes** (`notes.md`) — leave notes from the dashboard for the next session. The agent reads these but never modifies them.
- **Agent notes** (`agent-notes.md`) — agents leave notes for you and future sessions (decisions, warnings, handoff context, questions).

Both are displayed together in chronological order with **[user]** and **[agent]** badges. Agent notes are visually distinguished with a purple accent.

### Three Views

| View | Description |
|------|-------------|
| **Grid** | Cards with progress rings, pending tasks, notes preview |
| **List** | Compact table with priority, status, tasks, timestamps |
| **Timeline** | Horizontal bars showing project time spans, color-coded by status |

### Card Tags & Badges

Each card displays contextual tags to give you a quick overview at a glance:

| Tag | Example | Meaning |
|-----|---------|---------|
| **Status** | `in progress`, `completed`, `blocked`, `failed` | Current state of the session. Color-coded: cyan for active/done, yellow for blocked, red for failed. |
| **Priority** | `!!!`, `!!`, `!`, `~` | Urgency level — critical (red), high (yellow), medium (cyan), low (gray). Set from the detail view. |
| **Source** | `my-app` | Which project folder the session belongs to. Purple badge. |
| **Tracking** | `full`, `mid-project` | How tracking started — `full` (green) means from project inception, `mid-project` (yellow) means added to an existing project. |
| **Update Mode** | `auto`, `manual`, `budget` | How often the agent updates the tracking file. See [Update Modes](#update-modes--token-usage). |
| **Session Count** | `3 sess` | Number of Claude sessions that have contributed to this project. |
| **Branch** | `● feature/auth` | Current git branch the session is working on. |
| **Updated** | `2 hours ago` | Time since the tracking file was last modified. |
| **Tags** | `backend`, `auth` | Custom keywords set by the agent for categorization. Used in search. |

In the **detail view**, you'll also see:

| Tag | Meaning |
|-----|---------|
| **Session history chips** | List of all session IDs that contributed. The current/latest session is highlighted in cyan. |
| **[user] / [agent] note badges** | Who wrote each note — cyan for user, purple for agent. |
| **Repository** | The `owner/repo` identifier. |
| **Agent model** | Which Claude model is running the session (e.g. `claude-opus-4-6`). |

### Search & Filter

- **Search bar** — instantly filter by project title, tags, branch, or repository
- **Status filters** — All, In Progress, Completed, Blocked, Failed

### Priority

Set priority per project from the detail view: **critical** (`!!!`), **high** (`!!`), **medium** (`!`), **low** (`~`), or **none**.

Projects auto-sort by priority first, then by last updated.

### Display Settings

Adjust the dashboard layout without opening the full settings modal using the floating gear button (bottom-right corner):

- **Max Width** — full width or fixed (e.g. 1400px)
- **Row / Column Gap** — spacing between cards
- **Font Scale** — 70% to 150%

All inputs use a number + unit dropdown (px, %, rem, em, vw). Settings persist across page refreshes.

### Full-Screen Detail View

Click any project to open a full-screen detail page with:
- Progress ring with glow effect
- Remaining tasks shown at the top
- Handoff notes prominently displayed
- Notes timeline (user + agent) with comment thread
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

### New vs Existing Projects

| `tracking_start` | Behavior |
|-------------------|----------|
| `full` | Tracks everything from the beginning — complete activity log |
| `mid_project` | Agent does a quick scan, writes a Project Summary of prior work, then logs normally. |

The dashboard visually distinguishes these with badges: **full** (green) vs **mid-project** (yellow).

### Live Reload

The dashboard auto-updates when session files change — no manual refresh needed. Powered by Server-Sent Events watching all configured folders.

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
  "rowGap": "0px",
  "columnGap": "0px",
  "fontScale": "100",
  "port": 3890
}
```

All display settings are persisted to this file and restored on page refresh.

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
| `/api/notes?source=` | GET | Get merged user + agent notes for a project |
| `/api/notes?source=` | POST | Add a user note |
| `/api/events` | GET | SSE stream for live reload |

## Project Structure

```
claude-session-tracker/
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

## Development

```bash
npm run dev    # Starts with --watch for auto-restart on server changes
```

This is a free, open-source tool. Fork it, modify it, connect your own notification services, or extend it however you like.

## Design

UI design inspired by the [WZG Design System](https://webzgarden.com) by WebZGarden.

## License

MIT
