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

**Generate tech stack file:**
> Read `claude-session-track.md` and create the tech stack file at `.claude/sessions/tech-stack.md` for this project.

**Leave an agent note:**
> Read `claude-session-track.md` and add a note to `.claude/sessions/agent-notes.md` summarizing what was done this session.

## How It Works

```
Your Projects                          Dashboard (localhost:3890)
┌─────────────────────┐
│ project-a/           │               ┌────────────────────────────┐
│  .claude/sessions/   │──────────────▶│ ┌──────┐ ┌──────┐         │
│   session-tracker.md │               │ │!! 65%│ │  100%│  ...    │
│   notes.md           │               │ └──────┘ └──────┘         │
│   agent-notes.md     │               │                            │
│   tech-stack.md      │               │ Grid · List · Timeline    │
├─────────────────────┤               │ Search · Filter · Priority│
│ project-b/           │──────────────▶│ Notes · Activity Log      │
│  .claude/sessions/   │               └────────────────────────────┘
│   session-tracker.md │
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
- **Auto-discover** — add one or more root folders and the app scans recursively (up to 3 levels deep) for projects with `CLAUDE.md` or `.claude/sessions`. Nested projects are detected and listed with their relative paths so you can pick which ones to track.
- **Add manually** — paste specific folder paths

Config is saved to `tracker-config.json` (gitignored, portable between machines).

## Update Modes & Token Usage

Control how often the agent updates the tracking file:

| Mode | Behavior | Token Cost |
|------|----------|------------|
| **auto** | Updates after every prompt/response cycle. One activity log entry per interaction. | Highest — writes on every turn. |
| **manual** | Updates only when you ask (e.g. "update tracker"). Batches recent work into summaries. | Medium — **recommended default**. |
| **budget** | Updates twice per session — start and end only. Agent only reads frontmatter + Notes at start. | Lowest — best for tight budgets. |

The agent instruction file has been optimized to ~220 lines (down from ~450) to reduce token consumption on every read. Activity logs are capped at 15 entries and Changes Made at 5 sessions — older entries are archived automatically to keep the tracking file bounded.

## Features

### Notes — User & Agent

- **User notes** (`notes.md`) — leave notes from the dashboard for the next session
- **Agent notes** (`agent-notes.md`) — agents leave notes for you and future sessions

Both shown in a unified timeline with **[user]** and **[agent]** badges. Use the **All / User / Agent** tabs to filter.

### Tech Stack

Agents can create a `tech-stack.md` file on request with the project's stack, structure, core features, and recent changes. Shown as a collapsible section in the detail view. Updated when decisions affect the stack.

### Three Views

| View | Description |
|------|-------------|
| **Grid** | Cards with progress rings, pending tasks, notes preview |
| **List** | Compact table with priority, status, tasks, timestamps |
| **Timeline** | Horizontal bars showing project time spans |

### Card Tags & Badges

Each card shows two rows of metadata:

**Badge row:** source, version control, tracking mode, session count, update mode

**Info row:** git branch, last updated time

| Tag | Example | Meaning |
|-----|---------|---------|
| **Status** | `in progress`, `completed`, `blocked`, `failed` | Current state of the project |
| **Priority** | `!!!`, `!!`, `!`, `~` | Urgency level — critical, high, medium, low |
| **Source** | `my-app` | Which project folder this session belongs to |
| **Version Control** | `remote`, `local`, `no git` | Git status shown with an icon |
| **Tracking** | `full`, `mid-project` | `full` = from inception, `mid-project` = added to existing project |
| **Update Mode** | `auto`, `manual`, `budget` | How often the agent updates the file |
| **Session Count** | `3 sess` | Number of Claude sessions that have worked on this project |
| **Branch** | `● master` | Current git branch |
| **Updated** | `just now`, `2h ago` | Time since the tracking file was last modified |
| **Tags** | `backend`, `auth` | Custom keywords for categorization and search |

#### Color Meaning

| Color | Meaning |
|-------|---------|
| **Cyan** | Active / in progress / current |
| **Green** | Completed / full tracking |
| **Yellow** | Needs attention — blocked or mid-project |
| **Red** | Failed or error |
| **Purple** | Source project / agent notes |
| **Gray** | Inactive / low priority / informational |

### Detail View

Two-column layout: main content on the left, progress ring + session history in a sidebar.

**Meta rows** are grouped by type:
- Primary: status, priority, progress, task count
- Context: repository, branch, VC, model, update mode, source
- Temporal: created, updated, session count, tracking, current session

**Sections shown:** Objective, Project Summary, Changes Made, Key Decisions, Blockers. Tasks, Activity Log, and Notes are shown by their own dedicated widgets instead of duplicating raw markdown.

**Activity timeline** shows the last 8 entries by default with a "Show all" toggle.

| Element | Meaning |
|---------|---------|
| **Progress ring** | Visual progress (0–100%) in the sidebar |
| **Session history chips** | All session IDs that contributed, current highlighted |
| **Tech stack** | Collapsible section from `tech-stack.md` |
| **Pending tasks** | Remaining unchecked tasks |
| **Handoff notes** | Notes the agent left for the next session |
| **Notes panel** | User + agent notes with filter tabs |

### Search & Filter

- **Search bar** — filter by project title, tags, branch, or repository
- **Status filters** — All, In Progress, Completed, Blocked, Failed

### Priority

Set per project from the detail view: **critical** (`!!!`), **high** (`!!`), **medium** (`!`), **low** (`~`), or **none**. Projects auto-sort by priority first, then by last updated.

### Display Settings

Floating gear button (bottom-right) or the settings modal:

- **Max Width** — dashboard max width
- **Detail Max Width** — detail view max width (default 900px)
- **Row / Column Gap** — spacing between cards
- **Font Scale** — 70% to 150%, applies to all views

All inputs use number + unit dropdown (px, %, rem, em, vw). Settings persist across refreshes.

### Multi-Project Support

- Watch multiple project folders simultaneously
- **Auto-discover** projects recursively across multiple root folders
- Add/remove projects anytime via Settings

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
  "detailMaxWidth": "900px",
  "rowGap": "0px",
  "columnGap": "0px",
  "fontScale": "100",
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
version_control: "git_remote"
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

Sections: Objective, Project Summary (mid-project only), Tasks, Changes Made, Key Decisions, Blockers, Activity Log, Notes.

See [`claude-session-track.md`](claude-session-track.md) for the agent instruction specification.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sessions` | GET | All sessions from all watched folders |
| `/api/sessions/:file` | GET | Single session |
| `/api/sessions/:file` | PATCH | Update frontmatter (priority, etc.) |
| `/api/config` | GET | Current configuration |
| `/api/config` | POST | Save configuration |
| `/api/config/folders` | POST | Add a watch folder |
| `/api/config/folders` | DELETE | Remove a watch folder |
| `/api/discover?root=` | GET | Scan folder for projects (recursive) |
| `/api/tech-stack?source=` | GET | Get parsed tech stack file |
| `/api/notes?source=` | GET | Get merged user + agent notes |
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
