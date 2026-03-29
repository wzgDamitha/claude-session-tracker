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
- **Auto-discover** — add one or more root folders and the app scans for projects with `CLAUDE.md`
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

Both are displayed together in chronological order with **[user]** and **[agent]** badges.

### Three Views

| View | Description |
|------|-------------|
| **Grid** | Cards with progress rings, pending tasks, notes preview |
| **List** | Compact table with priority, status, tasks, timestamps |
| **Timeline** | Horizontal bars showing project time spans |

### Card Tags & Badges

Each card displays tags so you can understand the state of a project at a glance:

| Tag | Example | Meaning |
|-----|---------|---------|
| **Status** | `in progress`, `completed`, `blocked`, `failed` | Current state of the project |
| **Priority** | `!!!`, `!!`, `!`, `~` | Urgency level — critical, high, medium, low. Set from the detail view. |
| **Source** | `my-app` | Which project folder this session belongs to |
| **Tracking** | `full`, `mid-project` | How tracking was started — `full` means from project inception, `mid-project` means tracking was added to an existing project |
| **Update Mode** | `auto`, `manual`, `budget` | How often the agent updates the tracking file. See [Update Modes](#update-modes--token-usage). |
| **Session Count** | `3 sess` | Number of Claude sessions that have worked on this project |
| **Branch** | `● master`, `● feature/auth` | The git branch the current session is working on (e.g. `main`, `master`, `feature/auth`) |
| **Updated** | `2 hours ago` | Time since the tracking file was last modified |
| **Tags** | `backend`, `auth` | Custom keywords set by the agent for categorization. Used in search. |

#### Color Meaning

Colors are used consistently across the dashboard:

| Color | Meaning |
|-------|---------|
| **Cyan** | Active / in progress / current |
| **Green** | Completed / full tracking |
| **Yellow** | Needs attention — blocked or mid-project tracking |
| **Red** | Failed or error |
| **Purple** | Source project identifier / agent notes |
| **Gray** | Inactive / low priority / informational |

#### Detail View

Click any project to open a full detail page. In addition to the card tags above, you'll see:

| Element | Meaning |
|---------|---------|
| **Session history chips** | All session IDs that contributed to this project. The current session is highlighted. |
| **[user] / [agent] badges** | Who wrote each note in the notes timeline |
| **Repository** | The `owner/repo` identifier |
| **Agent model** | Which Claude model ran the session (e.g. `claude-opus-4-6`) |
| **Progress ring** | Visual progress indicator (0–100%) |
| **Pending tasks** | Remaining unchecked tasks from the tracking file |
| **Handoff notes** | Notes the agent left for the next session to continue from |

### Search & Filter

- **Search bar** — instantly filter by project title, tags, branch, or repository
- **Status filters** — All, In Progress, Completed, Blocked, Failed

### Priority

Set priority per project from the detail view: **critical** (`!!!`), **high** (`!!`), **medium** (`!`), **low** (`~`), or **none**.

Projects auto-sort by priority first, then by last updated.

### Display Settings

Adjust the dashboard layout using the floating gear button (bottom-right corner):

- **Max Width** — full width or fixed (e.g. 1400px)
- **Row / Column Gap** — spacing between cards
- **Font Scale** — 70% to 150%

All inputs use a number + unit dropdown (px, %, rem, em, vw). Settings persist across page refreshes.

### One File Per Project

Every project has a single file: `.claude/sessions/session-tracker.md`

Multiple sessions update the same file. The dashboard tracks which sessions contributed, session boundaries in the activity timeline, and the current active session and branch.

### Multi-Project Support

- Watch multiple project folders simultaneously
- Each card shows which project it belongs to
- **Auto-discover** projects by scanning multiple root folders for `CLAUDE.md`
- Add/remove projects anytime via Settings

### New vs Existing Projects

| `tracking_start` | Behavior |
|-------------------|----------|
| `full` | Tracks everything from the beginning — complete activity log |
| `mid_project` | Agent does a quick scan, writes a Project Summary of prior work, then logs normally. |

### Live Reload

The dashboard auto-updates when session files change — no manual refresh needed.

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
  "discoverRoots": ["C:\\Projects", "D:\\Work"],
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
│   └── styles.css            // Dark theme
├── claude-session-track.md   // Agent instruction file (share this)
├── SESSION_TEMPLATE.md       // Quick reference template
├── tracker-config.json       // Generated on first run (gitignored)
└── package.json
```

## Development

```bash
npm run dev    # Starts with --watch for auto-restart on server changes
```

## Design

UI design inspired by the [WZG Design System](https://webzgarden.com) by WebZGarden.

## License

MIT
