## Use Cases

### Session Tracking
- Track progress across multiple projects from one dashboard
- See which projects are active, blocked, completed, or failed at a glance
- Know exactly where a session left off via handoff notes
- Hand off context between Claude Code sessions — one writes, the next reads
- Track which sessions contributed to a project and what each one did

### Notes (User → Agent)
- Leave instructions for the next session ("focus on payments first")
- Dump remaining work when a session hits its limit ("still need to wire up webhooks")
- Capture new ideas before they're lost ("consider switching to Redis")
- Flag blockers ("waiting on API key from client")
- Set priorities ("auth is more urgent than the admin panel")
- Deployment checklists ("run migrations, update env vars, clear cache")
- Environment context ("new Stripe key in #dev channel")
- Prevent repeated mistakes ("don't upgrade React yet, auth library doesn't support it")

### Notes (Agent → User)
- Session summaries — what was done, what's left
- Decisions made and why ("chose JWT over session cookies for stateless auth")
- Warnings ("skipped input validation on admin routes — needs review")
- Questions for the user ("should we add rate limiting to the public API?")
- Debugging breadcrumbs ("bug is in webhook handler, signature check passes but event mapping is wrong")
- What was tried and ruled out — saves the next session from repeating dead ends

### Priority System
- Surface critical projects to the top of the dashboard
- Triage across multiple projects — see what needs attention first
- Reprioritize from the dashboard without opening a session

### Update Modes & Token Management
- manual — control exactly when tokens are spent on tracking
- budget — minimal overhead for tight token budgets (start + end only)
- auto — detailed per-interaction audit trail when needed
- Rolling windows keep files bounded — older entries archived automatically
- Compare progress across sessions to understand where tokens go

### Tech Stack File
- Quick-reference for the project's stack, structure, and core features
- Created on demand — no wasted tokens if you don't need it
- Auto-updated when decisions affect the stack (e.g. switching databases)
- Helps new sessions understand the project without scanning the codebase

### Multi-Project & Discovery
- Watch multiple project folders from one dashboard
- Auto-discover projects recursively — finds nested projects in monorepos
- Choose which sub-projects to track individually
- Add or remove projects anytime from settings

### Views
- Grid — visual overview with progress rings, pending tasks, notes
- List — compact table for scanning many projects quickly
- Timeline — see which projects have been active recently vs stale

### Search & Filter
- Find projects by title, tags, branch, or repository
- Filter by status to focus on what's blocked or failing
- Tags let you group projects by domain (backend, frontend, auth)

### Version Control Status
- See at a glance if a project has git, local only, or a remote
- Know which projects are just local folders vs pushed to GitHub

### Display Settings
- Adjust layout width, gaps, and font scale to your preference
- Settings persist across refreshes
- Floating quick-settings panel for fast adjustments

### Live Reload
- Dashboard updates automatically when session files change
- No manual refresh needed — just leave it open

---

### Combined Use Cases

**Session limit recovery** — session hits its token cap, dump remaining tasks and ideas into notes, next session reads notes and picks up exactly where you left off

**Multi-session debugging** — first session investigates and logs what was tried in agent notes, second session reads the notes and skips dead ends, faster resolution without repeating work

**Project handoff between people** — one person works on a project and the agent leaves detailed notes, another person starts a session and has full context from notes + tech stack + activity log

**Sprint planning across projects** — set priorities on each project from the dashboard, use the grid view to see critical items first, leave notes for each project about what to focus on

**Onboarding a new project** — use mid-project tracking to get a quick summary, generate tech stack file, future sessions have full context without reading the whole codebase

**Cost-conscious development** — use budget mode for routine tasks, switch to manual for important features, use auto only when you need a detailed audit trail, rolling windows keep file sizes bounded

**Code review workflow** — leave a note "review error handling in checkout before merging", next session audits instead of building, agent notes any issues found for the user to review

**Monorepo management** — recursive discovery finds all sub-projects, track each package separately, timeline view shows which packages are actively worked on, priority system surfaces what needs attention
