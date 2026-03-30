// --- State ---
let sessions = [];
let activeFilter = 'all';
let currentView = 'grid';
let searchQuery = '';
let currentConfig = null;

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, none: 4 };
let calendarDate = null;
let calendarTodos = [];
let calendarSelectedDay = null;
const VC_GIT_ICON = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>';
const VC_CLOUD_ICON = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 12a3.5 3.5 0 0 1-.95-6.87A5.002 5.002 0 0 1 13.35 6.1 3.001 3.001 0 0 1 13 12H4.5ZM8 2a4 4 0 0 0-3.83 2.82A2.5 2.5 0 0 0 4.5 11H13a2 2 0 1 0-.22-3.99A4.001 4.001 0 0 0 8 2Z"/></svg>';
const VC_FOLDER_ICON = '<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/></svg>';
const PRIORITY_CONFIG = {
  critical: { label: '!!!', color: '--red' },
  high: { label: '!!', color: '--yellow' },
  medium: { label: '!', color: '--accent' },
  low: { label: '~', color: '--text-tertiary' },
  none: { label: '', color: '' },
};

// --- DOM refs ---
const wizardOverlay = document.getElementById('wizard-overlay');
const wizardStepMode = document.getElementById('wizard-step-mode');
const wizardStepPaths = document.getElementById('wizard-step-paths');
const wizardShared = document.getElementById('wizard-shared');
const wizardIndividual = document.getElementById('wizard-individual');
const wizardSharedInput = document.getElementById('wizard-shared-input');
const wizardFolderInput = document.getElementById('wizard-folder-input');
const wizardFolderList = document.getElementById('wizard-folder-list');
const wizardAddBtn = document.getElementById('wizard-add-btn');
const wizardBackBtn = document.getElementById('wizard-back');
const wizardSaveBtn = document.getElementById('wizard-save-btn');
const wizardError = document.getElementById('wizard-error');

const appEl = document.getElementById('app');
const grid = document.getElementById('sessions-grid');
const emptyState = document.getElementById('empty-state');
const headerStats = document.getElementById('header-stats');
const settingsBtn = document.getElementById('settings-btn');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsClose = document.getElementById('settings-close');
const settingsBody = document.getElementById('settings-body');
const searchInput = document.getElementById('search-input');
const detailScreen = document.getElementById('detail-screen');
const detailBody = document.getElementById('detail-body');
const detailBack = document.getElementById('detail-back');
const viewToggle = document.getElementById('view-toggle');
const filtersContainer = document.getElementById('filters');
const floatingSettingsBtn = document.getElementById('floating-settings-btn');
const floatingSettingsPanel = document.getElementById('floating-settings-panel');
const floatingSettingsClose = document.getElementById('floating-settings-close');
const floatingSettingsContent = document.getElementById('floating-settings-content');

// --- Wizard ---
let wizardMode = null;
let wizardFolders = [];
let discoveredProjects = [];

document.querySelectorAll('.wizard-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    wizardMode = btn.dataset.mode;
    document.querySelectorAll('.wizard-mode-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    wizardStepMode.classList.add('hidden');
    wizardStepPaths.classList.remove('hidden');
    if (wizardMode === 'shared') {
      wizardShared.classList.remove('hidden');
      wizardIndividual.classList.add('hidden');
    } else {
      wizardShared.classList.add('hidden');
      wizardIndividual.classList.remove('hidden');
    }
  });
});

wizardBackBtn.addEventListener('click', () => {
  wizardStepPaths.classList.add('hidden');
  wizardStepMode.classList.remove('hidden');
  wizardError.classList.add('hidden');
});

function renderWizardFolders() {
  wizardFolderList.innerHTML = wizardFolders.map((f, i) => `
    <li><span>${escapeHtml(f)}</span><button class="remove-btn" data-index="${i}">&times;</button></li>
  `).join('');
  wizardFolderList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wizardFolders.splice(parseInt(btn.dataset.index), 1);
      renderWizardFolders();
    });
  });
}

wizardAddBtn.addEventListener('click', () => {
  const val = wizardFolderInput.value.trim();
  if (val && !wizardFolders.includes(val)) {
    wizardFolders.push(val);
    wizardFolderInput.value = '';
    renderWizardFolders();
  }
});

wizardFolderInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') wizardAddBtn.click(); });

// --- Discover ---
const wizardDiscoverInput = document.getElementById('wizard-discover-input');
const wizardDiscoverAddRoot = document.getElementById('wizard-discover-add-root');
const wizardDiscoverBtn = document.getElementById('wizard-discover-btn');
const wizardDiscoverResults = document.getElementById('wizard-discover-results');
const wizardDiscoverList = document.getElementById('wizard-discover-list');
const wizardDiscoverRootsList = document.getElementById('wizard-discover-roots-list');
const wizardSelectAll = document.getElementById('wizard-select-all');
let wizardDiscoverRoots = [];

function renderWizardDiscoverRoots() {
  wizardDiscoverRootsList.innerHTML = wizardDiscoverRoots.map((r, i) => `
    <li><span>${escapeHtml(r)}</span><button class="remove-btn" data-index="${i}">&times;</button></li>
  `).join('');
  wizardDiscoverRootsList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wizardDiscoverRoots.splice(parseInt(btn.dataset.index), 1);
      renderWizardDiscoverRoots();
    });
  });
}

wizardDiscoverAddRoot.addEventListener('click', () => {
  const val = wizardDiscoverInput.value.trim();
  if (val && !wizardDiscoverRoots.includes(val)) {
    wizardDiscoverRoots.push(val);
    wizardDiscoverInput.value = '';
    renderWizardDiscoverRoots();
  }
});

wizardDiscoverBtn.addEventListener('click', async () => {
  // Collect roots: any in the list + whatever is typed in the input
  const typed = wizardDiscoverInput.value.trim();
  const roots = [...wizardDiscoverRoots];
  if (typed && !roots.includes(typed)) {
    roots.push(typed);
    wizardDiscoverRoots.push(typed);
    wizardDiscoverInput.value = '';
    renderWizardDiscoverRoots();
  }
  if (roots.length === 0) return;
  wizardDiscoverBtn.textContent = 'Scanning...';
  wizardDiscoverBtn.disabled = true;
  try {
    discoveredProjects = [];
    for (const root of roots) {
      const res = await fetch(`/api/discover?root=${encodeURIComponent(root)}`);
      const data = await res.json();
      if (!res.ok) { showWizardError(data.error || `Scan failed for ${root}`); continue; }
      discoveredProjects.push(...data.projects);
    }
    renderDiscoverResults();
    wizardDiscoverResults.classList.remove('hidden');
  } catch (err) {
    showWizardError('Connection error: ' + err.message);
  } finally {
    wizardDiscoverBtn.textContent = 'Scan';
    wizardDiscoverBtn.disabled = false;
  }
});

wizardDiscoverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') wizardDiscoverAddRoot.click(); });

wizardSelectAll.addEventListener('click', () => {
  discoveredProjects.forEach(p => { if (p.hasClaude) p._selected = true; });
  renderDiscoverResults();
  syncDiscoverToFolders();
});

function renderDiscoverResults() {
  wizardDiscoverList.innerHTML = discoveredProjects.map((p, i) => {
    const badges = [];
    if (p.hasClaude) badges.push('<span class="discover-badge claude">CLAUDE.md</span>');
    else badges.push('<span class="discover-badge no-claude">no CLAUDE.md</span>');
    if (p.sessionCount > 0) badges.push(`<span class="discover-badge sessions">${p.sessionCount} session${p.sessionCount > 1 ? 's' : ''}</span>`);
    return `
      <li class="discover-item" data-index="${i}">
        <input type="checkbox" ${p._selected ? 'checked' : ''} data-index="${i}">
        <div class="discover-item-info">
          <div class="discover-item-name">${escapeHtml(p.name)}</div>
          <div class="discover-item-path">${escapeHtml(p.sessionsPath)}</div>
        </div>
        <div class="discover-item-badges">${badges.join('')}</div>
      </li>`;
  }).join('');
  wizardDiscoverList.querySelectorAll('.discover-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.type === 'checkbox') return;
      const idx = parseInt(item.dataset.index);
      discoveredProjects[idx]._selected = !discoveredProjects[idx]._selected;
      renderDiscoverResults();
      syncDiscoverToFolders();
    });
  });
  wizardDiscoverList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      discoveredProjects[parseInt(cb.dataset.index)]._selected = cb.checked;
      syncDiscoverToFolders();
    });
  });
}

function syncDiscoverToFolders() {
  const selectedPaths = discoveredProjects.filter(p => p._selected).map(p => p.sessionsPath);
  const manualFolders = wizardFolders.filter(f => !discoveredProjects.some(p => p.sessionsPath === f));
  wizardFolders = [...manualFolders, ...selectedPaths];
  renderWizardFolders();
}

// Save config
wizardSaveBtn.addEventListener('click', async () => {
  wizardError.classList.add('hidden');
  wizardSaveBtn.disabled = true;
  const body = { mode: wizardMode };
  if (wizardMode === 'shared') {
    const folder = wizardSharedInput.value.trim();
    if (!folder) { showWizardError('Please enter a folder path.'); return; }
    body.sharedFolder = folder;
  } else {
    if (wizardFolders.length === 0) { showWizardError('Please add at least one folder.'); return; }
    body.watchFolders = wizardFolders;
    body.discoverRoots = wizardDiscoverRoots;
  }
  try {
    const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showWizardError(data.error || 'Failed to save config'); return; }
    currentConfig = data.config;
    wizardOverlay.classList.add('hidden');
    appEl.classList.remove('hidden');
    fetchSessions();
  } catch (err) {
    showWizardError('Connection error: ' + err.message);
  } finally {
    wizardSaveBtn.disabled = false;
  }
});

function showWizardError(msg) {
  wizardError.textContent = msg;
  wizardError.classList.remove('hidden');
  wizardSaveBtn.disabled = false;
}

// --- Init ---
async function init() {
  try {
    const res = await fetch('/api/config');
    currentConfig = await res.json();
    if (currentConfig.configured) {
      wizardOverlay.classList.add('hidden');
      appEl.classList.remove('hidden');
      applyDisplaySettings(currentConfig);
      fetchSessions();
    } else {
      wizardOverlay.classList.remove('hidden');
      appEl.classList.add('hidden');
    }
  } catch (err) {
    console.error('Failed to load config:', err);
    wizardOverlay.classList.remove('hidden');
  }
}

async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    sessions = await res.json();
    render();
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  }
}

// --- Render ---
function render() {
  // Filter by status
  let filtered = activeFilter === 'all' ? [...sessions] : sessions.filter(s => s.status === activeFilter);

  // Search
  const q = searchQuery.toLowerCase();
  if (q) {
    filtered = filtered.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q)) ||
      (s.current_branch || s.branch || '').toLowerCase().includes(q) ||
      (s.repository || '').toLowerCase().includes(q)
    );
  }

  // Sort by priority first, then by updated_at
  filtered.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority || 'none'] ?? 4;
    const pb = PRIORITY_ORDER[b.priority || 'none'] ?? 4;
    if (pa !== pb) return pa - pb;
    const da = a.updated_at ? new Date(a.updated_at) : new Date(0);
    const db = b.updated_at ? new Date(b.updated_at) : new Date(0);
    return db - da;
  });

  const counts = {};
  for (const s of sessions) counts[s.status] = (counts[s.status] || 0) + 1;

  headerStats.innerHTML = `
    <span class="stat"><span class="stat-dot stat-dot-active"></span> ${counts.in_progress || 0} active</span>
    <span class="stat"><span class="stat-dot stat-dot-done"></span> ${counts.completed || 0} done</span>
    <span class="stat"><span class="stat-dot stat-dot-blocked"></span> ${counts.blocked || 0} blocked</span>
    <span class="stat">${sessions.length} total</span>
  `;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    grid.appendChild(emptyState);
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  if (currentView === 'calendar') {
    grid.className = 'calendar-container';
    renderCalendarView(grid);
    return;
  } else if (currentView === 'timeline') {
    grid.className = 'sessions-timeline';
    grid.innerHTML = timelineViewHTML(filtered);
    grid.querySelectorAll('.timeline-row').forEach(row => {
      row.addEventListener('click', () => {
        const session = sessions.find(s => s.file === row.dataset.file && s.sourceFolder === row.dataset.source);
        if (session) openDetail(session);
      });
    });
  } else if (currentView === 'list') {
    grid.className = 'sessions-list';
    grid.innerHTML = listHeaderHTML() + filtered.map(s => listRowHTML(s)).join('');
    grid.querySelectorAll('.list-row').forEach(row => {
      row.addEventListener('click', () => {
        const session = sessions.find(s => s.file === row.dataset.file && s.sourceFolder === row.dataset.source);
        if (session) openDetail(session);
      });
    });
  } else {
    grid.className = 'sessions-grid';
    grid.innerHTML = filtered.map(s => cardHTML(s)).join('');
    grid.querySelectorAll('.session-card').forEach(card => {
      card.addEventListener('click', () => {
        const session = sessions.find(s => s.file === card.dataset.file && s.sourceFolder === card.dataset.source);
        if (session) openDetail(session);
      });
    });
  }
}

function statusColorVar(status) {
  return { in_progress: '--accent', completed: '--accent', blocked: '--yellow', failed: '--red', not_started: '--text-tertiary' }[status] || '--text-tertiary';
}

function glowClass(status) {
  return { in_progress: 'glow-blue', completed: 'glow-green', blocked: 'glow-yellow', failed: 'glow-red', not_started: 'glow-muted' }[status] || 'glow-muted';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function cardHTML(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;

  // Parse tasks
  const tasksSection = s.sections?.['Tasks'] || '';
  const allTasks = tasksSection.split('\n').filter(l => /^- \[[ x]\]/i.test(l));
  const pendingTasks = allTasks.filter(l => /^- \[ \]/.test(l)).map(l => l.replace(/^- \[ \]\s*/i, ''));
  const doneTasks = allTasks.filter(l => /^- \[x\]/i.test(l)).map(l => l.replace(/^- \[x\]\s*/i, ''));

  // Notes preview
  const notesSection = s.sections?.['Notes'] || '';
  const notesPreview = notesSection.trim().split('\n')[0]?.substring(0, 120) || '';

  // Badges
  const tags = (s.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const sourceLabel = s.sourceName ? `<span class="source-tag">${escapeHtml(s.sourceName)}</span>` : '';
  const vcLabel = s.version_control === 'git_remote' ? `<span class="vc-badge vc-remote">${VC_CLOUD_ICON}remote</span>`
    : s.version_control === 'git_local' ? `<span class="vc-badge vc-local">${VC_GIT_ICON}local</span>`
    : s.version_control === 'none' ? `<span class="vc-badge vc-none">${VC_FOLDER_ICON}no git</span>` : '';
  const modeLabel = s.update_mode ? `<span class="update-mode-tag">${escapeHtml(s.update_mode)}</span>` : '';
  const trackingLabel = s.tracking_start === 'mid_project' ? '<span class="tracking-badge tracking-mid">mid-project</span>'
    : s.tracking_start === 'full' ? '<span class="tracking-badge tracking-full">full</span>' : '';
  const sessionCountLabel = s.sessionCount ? `<span class="session-count-tag">${s.sessionCount} sess</span>` : '';
  const pri = s.priority || 'none';
  const priConf = PRIORITY_CONFIG[pri];
  const priorityBadge = pri !== 'none' ? `<span class="priority-badge priority-${pri}">${priConf.label}</span>` : '';

  // Pending tasks (shown prominently)
  let nextUpHTML = '';
  if (pendingTasks.length > 0) {
    const shown = pendingTasks.slice(0, 3);
    const more = pendingTasks.length > 3 ? `<div style="font-size:11px;color:var(--text-tertiary);padding-left:1rem;margin-top:4px">+${pendingTasks.length - 3} more</div>` : '';
    nextUpHTML = `
      <div class="card-next-up">
        <div class="card-next-up-title">// next up</div>
        ${shown.map(t => `<div class="task-item"><span class="task-pending">&#9679;</span> <span>${escapeHtml(t)}</span></div>`).join('')}
        ${more}
      </div>`;
  }

  // Done tasks (compact)
  let doneHTML = '';
  if (doneTasks.length > 0) {
    const shownDone = doneTasks.slice(-3);
    doneHTML = `
      <div class="card-done">
        <div class="card-done-title">${doneTasks.length} completed</div>
        ${shownDone.map(t => `<div class="task-item"><span class="task-check">&#10003;</span> <span>${escapeHtml(t)}</span></div>`).join('')}
      </div>`;
  }

  // Latest activity
  const latest = s.activityLog && s.activityLog.length > 0 ? s.activityLog[s.activityLog.length - 1] : null;
  const latestHTML = latest ? `<div class="card-latest"><span>//</span> ${escapeHtml(latest.title)}</div>` : '';

  // Notes
  const notesHTML = notesPreview && notesPreview !== '_None._' && !notesPreview.startsWith('_None')
    ? `<div class="card-notes">"${escapeHtml(notesPreview)}${notesPreview.length >= 120 ? '...' : ''}"</div>` : '';

  // Card progress ring (smaller version)
  const cardRingR = 20;
  const cardCirc = 2 * Math.PI * cardRingR;
  const cardOffset = cardCirc - (progress / 100) * cardCirc;
  const cardColorVar = statusColorVar(status);

  return `
    <div class="session-card" data-file="${escapeHtml(s.file)}" data-source="${escapeHtml(s.sourceFolder)}" data-status="${status}">
      <div class="status-stripe stripe-${status}"></div>
      <div class="card-header">
        <span class="card-title">${escapeHtml(s.title || s.file)}${priorityBadge}</span>
        <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      </div>
      <div class="card-meta">
        ${sourceLabel}${vcLabel}${trackingLabel}${sessionCountLabel}${modeLabel}
      </div>
      <div class="card-meta-sub">
        ${s.current_branch || s.branch ? `<span>&#9702; ${escapeHtml(s.current_branch || s.branch)}</span>` : ''}
        ${s.updated_at ? `<span>${timeAgo(s.updated_at)}</span>` : ''}
      </div>
      <div class="card-progress">
        <div class="card-ring">
          <svg width="48" height="48">
            <circle class="card-ring-bg" cx="24" cy="24" r="${cardRingR}"/>
            <circle class="card-ring-fill" cx="24" cy="24" r="${cardRingR}"
              style="stroke:var(${cardColorVar});stroke-dasharray:${cardCirc};stroke-dashoffset:${cardOffset}"/>
          </svg>
          <span class="card-ring-text">${progress}%</span>
        </div>
        <div class="card-progress-info">
          <div class="card-progress-tasks">${s.tasks.done} of ${s.tasks.total} tasks</div>
          <div class="card-progress-bar-wrap">
            <div class="progress-bar-container">
              <div class="progress-bar-fill ${glowClass(status)}" style="width:${progress}%"></div>
            </div>
          </div>
        </div>
      </div>
      ${nextUpHTML}
      ${doneHTML}
      ${latestHTML}
      ${notesHTML}
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    </div>`;
}

// --- List view ---
function listHeaderHTML() {
  return `<div class="list-header">
    <span></span>
    <span>Project</span>
    <span>Branch</span>
    <span>Priority</span>
    <span>Status</span>
    <span>Tasks</span>
    <span>Updated</span>
  </div>`;
}

function listRowHTML(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;
  const ringR = 16;
  const circ = 2 * Math.PI * ringR;
  const off = circ - (progress / 100) * circ;
  const colorVar = statusColorVar(status);

  return `
    <div class="list-row" data-file="${escapeHtml(s.file)}" data-source="${escapeHtml(s.sourceFolder)}">
      <div class="list-row-ring">
        <svg width="40" height="40">
          <circle class="list-row-ring-bg" cx="20" cy="20" r="${ringR}"/>
          <circle class="list-row-ring-fill" cx="20" cy="20" r="${ringR}"
            style="stroke:var(${colorVar});stroke-dasharray:${circ};stroke-dashoffset:${off}"/>
        </svg>
        <span class="list-row-ring-text">${progress}%</span>
      </div>
      <div class="list-row-title">${escapeHtml(s.title || s.file)}</div>
      <div class="list-row-meta">${escapeHtml(s.current_branch || s.branch || '')}</div>
      <div class="priority-badge priority-${s.priority || 'none'}">${(PRIORITY_CONFIG[s.priority || 'none'] || {}).label || ''}</div>
      <div><span class="status-badge status-${status}">${status.replace('_', ' ')}</span></div>
      <div class="list-row-tasks">${s.tasks.done}/${s.tasks.total}</div>
      <div class="list-row-time">${s.updated_at ? timeAgo(s.updated_at) : ''}</div>
    </div>`;
}

// --- Timeline view ---
function timelineViewHTML(sessions) {
  if (sessions.length === 0) return '<div class="timeline-empty">No sessions to display</div>';

  // Compute date range
  let minDate = Infinity, maxDate = -Infinity;
  const now = Date.now();
  for (const s of sessions) {
    const start = s.created_at ? new Date(s.created_at).getTime() : (s.updated_at ? new Date(s.updated_at).getTime() : now);
    const end = s.updated_at ? new Date(s.updated_at).getTime() : start;
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  }

  // Pad by 1 day on each side
  const DAY = 86400000;
  minDate -= DAY;
  maxDate = Math.max(maxDate + DAY, now + DAY);
  const span = maxDate - minDate;

  // Generate axis labels (roughly 8-12 labels)
  const labelCount = Math.min(12, Math.max(4, Math.ceil(span / DAY)));
  const step = span / labelCount;
  let axisHTML = '';
  for (let i = 0; i <= labelCount; i++) {
    const d = new Date(minDate + step * i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    axisHTML += `<span class="timeline-axis-label">${label}</span>`;
  }

  // Today marker position
  const todayPct = ((now - minDate) / span) * 100;

  // Build rows
  const rowsHTML = sessions.map(s => {
    const status = s.status || 'not_started';
    const start = s.created_at ? new Date(s.created_at).getTime() : (s.updated_at ? new Date(s.updated_at).getTime() : now);
    const end = s.updated_at ? new Date(s.updated_at).getTime() : start;
    const leftPct = ((start - minDate) / span) * 100;
    const widthPct = Math.max(1.5, ((end - start) / span) * 100);
    const pri = s.priority || 'none';
    const priLabel = PRIORITY_CONFIG[pri]?.label || '';

    return `
      <div class="timeline-row" data-file="${escapeHtml(s.file)}" data-source="${escapeHtml(s.sourceFolder)}">
        <div class="timeline-label">${priLabel ? `<span class="priority-badge priority-${pri}">${priLabel}</span> ` : ''}${escapeHtml(s.title || s.file)}</div>
        <div class="timeline-track">
          <div class="timeline-today" style="left:${todayPct}%"></div>
          <div class="timeline-bar timeline-bar-${status}" style="left:${leftPct}%;width:${widthPct}%">
            <span class="timeline-bar-text">${s.progress || 0}%</span>
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="timeline-axis">${axisHTML}</div>
    ${rowsHTML}`;
}

// --- Detail (full screen) ---
function openDetail(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;
  const ringRadius = 34;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference - (progress / 100) * circumference;
  const colorVar = statusColorVar(status);

  const isMidProject = s.tracking_start === 'mid_project';
  let midProjectNotice = isMidProject ? `
    <div class="mid-project-notice">
      <div class="mid-project-label">// mid-project tracking</div>
      <div class="mid-project-desc">Tracking started after the project was already in progress. The Project Summary covers prior work. The Activity Log only covers work from the tracking start point.</div>
    </div>` : '';

  let sessionHistoryHTML = '';
  if (s.sessionHistory && s.sessionHistory.length > 0) {
    sessionHistoryHTML = `
      <div class="session-history">
        <h3>Session History</h3>
        <div class="session-history-list">
          ${s.sessionHistory.map((sh, i) => `
            <span class="session-history-chip ${i === s.sessionHistory.length - 1 ? 'current' : ''}">${escapeHtml(sh.sessionId)}</span>
          `).join('')}
        </div>
      </div>`;
  }

  let timelineHTML = '';
  if (s.activityLog && s.activityLog.length > 0) {
    const maxVisible = 8;
    const entries = s.activityLog;
    const hasMore = entries.length > maxVisible;
    const visibleEntries = hasMore ? entries.slice(-maxVisible) : entries;
    const hiddenEntries = hasMore ? entries.slice(0, entries.length - maxVisible) : [];
    timelineHTML = `
      <h2 style="color:var(--accent);margin-top:1.5rem;margin-bottom:0.75rem;">Activity Timeline</h2>
      ${isMidProject ? '<div class="timeline-partial-notice">// activity from tracking start point only</div>' : ''}
      <div class="activity-timeline">
        ${hasMore ? `
          <div class="activity-hidden" id="activity-hidden" style="display:none">
            ${hiddenEntries.map(entry => {
              const isBoundary = entry.type === 'session_start' || entry.type === 'session_end';
              return `
                <div class="activity-entry ${isBoundary ? 'activity-boundary' : ''}">
                  <div class="activity-time">${escapeHtml(entry.timestamp)}</div>
                  <div class="activity-title">${escapeHtml(entry.title)}</div>
                  ${entry.body ? `<div class="activity-body">${escapeHtml(entry.body)}</div>` : ''}
                </div>`;
            }).join('')}
          </div>` : ''}
        ${visibleEntries.map(entry => {
          const isBoundary = entry.type === 'session_start' || entry.type === 'session_end';
          return `
            <div class="activity-entry ${isBoundary ? 'activity-boundary' : ''}">
              <div class="activity-time">${escapeHtml(entry.timestamp)}</div>
              <div class="activity-title">${escapeHtml(entry.title)}</div>
              ${entry.body ? `<div class="activity-body">${escapeHtml(entry.body)}</div>` : ''}
            </div>`;
        }).join('')}
      </div>
      ${hasMore ? `<button class="activity-toggle-btn" id="activity-toggle-btn">Show all ${entries.length} entries</button>` : ''}`;
  }

  // Pending tasks for modal top
  const tasksSection = s.sections?.['Tasks'] || '';
  const allTasks = tasksSection.split('\n').filter(l => /^- \[[ x]\]/i.test(l));
  const pendingTasks = allTasks.filter(l => /^- \[ \]/.test(l)).map(l => l.replace(/^- \[ \]\s*/i, ''));
  const notesSection = s.sections?.['Notes'] || '';

  let pendingHTML = '';
  if (pendingTasks.length > 0) {
    pendingHTML = `
      <div class="card-next-up detail-pending">
        <div class="card-next-up-title">// remaining tasks (${pendingTasks.length})</div>
        ${pendingTasks.map(t => `<div class="task-item"><span class="task-pending">&#9679;</span> <span>${escapeHtml(t)}</span></div>`).join('')}
      </div>`;
  }

  let notesTopHTML = '';
  if (notesSection.trim() && !notesSection.trim().startsWith('_None')) {
    notesTopHTML = `
      <div class="detail-handoff">
        <div class="detail-handoff-label">// handoff notes</div>
        <div class="detail-handoff-body">${escapeHtml(notesSection.trim())}</div>
      </div>`;
  }

  detailBody.innerHTML = `
    <h2>${escapeHtml(s.title || s.file)}</h2>
    <div class="detail-meta">
      <div class="detail-meta-row detail-meta-primary">
        <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
        <select class="priority-select" id="priority-select" data-file="${escapeHtml(s.file)}" data-source="${escapeHtml(s.sourceFolder)}">
          ${['none','low','medium','high','critical'].map(p => `<option value="${p}" ${(s.priority||'none')===p?'selected':''}>${p}</option>`).join('')}
        </select>
        <span>${progress}%</span>
        <span>${s.tasks.done}/${s.tasks.total} tasks</span>
      </div>
      <div class="detail-meta-row detail-meta-context">
        ${s.repository ? `<span>${escapeHtml(s.repository)}</span>` : ''}
        ${s.current_branch || s.branch ? `<span>&#9702; ${escapeHtml(s.current_branch || s.branch)}</span>` : ''}
        ${s.version_control === 'git_remote' ? `<span class="vc-badge vc-remote">${VC_CLOUD_ICON}remote</span>`
          : s.version_control === 'git_local' ? `<span class="vc-badge vc-local">${VC_GIT_ICON}local</span>`
          : s.version_control === 'none' ? `<span class="vc-badge vc-none">${VC_FOLDER_ICON}no git</span>` : ''}
        ${s.agent_model ? `<span>${escapeHtml(s.agent_model)}</span>` : ''}
        ${s.update_mode ? `<span class="update-mode-tag">${escapeHtml(s.update_mode)}</span>` : ''}
        ${s.sourceName ? `<span class="source-tag">${escapeHtml(s.sourceName)}</span>` : ''}
      </div>
      <div class="detail-meta-row detail-meta-temporal">
        ${s.created_at ? `<span>since ${new Date(s.created_at).toLocaleDateString()}</span>` : ''}
        ${s.updated_at ? `<span>updated ${new Date(s.updated_at).toLocaleString()}</span>` : ''}
        ${s.sessionCount ? `<span class="session-count-tag">${s.sessionCount} session${s.sessionCount > 1 ? 's' : ''}</span>` : ''}
        ${s.tracking_start === 'mid_project' ? '<span class="tracking-badge tracking-mid">mid-project</span>' : ''}
        ${s.tracking_start === 'full' ? '<span class="tracking-badge tracking-full">full</span>' : ''}
        ${s.current_session ? `<span>current: ${escapeHtml(s.current_session)}</span>` : ''}
      </div>
    </div>
    <div class="detail-top-grid">
      <div class="detail-main-col">
        <div class="tech-stack-section" id="tech-stack-section" style="display:none">
          <div class="tech-stack-header" id="tech-stack-toggle">
            <span class="user-notes-title">// Tech Stack</span>
            <span class="tech-stack-chevron" id="tech-stack-chevron">&#9654;</span>
          </div>
          <div class="tech-stack-content" id="tech-stack-content"></div>
        </div>
        ${midProjectNotice}
        ${pendingHTML}
        ${notesTopHTML}
      </div>
      <div class="detail-sidebar">
        <div class="modal-progress">
          <div class="progress-ring">
            <svg width="80" height="80">
              <circle class="progress-ring-bg" cx="40" cy="40" r="34"/>
              <circle class="progress-ring-fill" cx="40" cy="40" r="34"
                style="stroke:var(${colorVar});stroke-dasharray:${circumference};stroke-dashoffset:${offset}"/>
            </svg>
            <div class="progress-ring-text">${progress}%</div>
          </div>
          <div>
            <div class="progress-stats">${s.tasks.done} of ${s.tasks.total} tasks</div>
            <div class="progress-remaining">${s.tasks.total - s.tasks.done} remaining</div>
          </div>
        </div>
        <div class="sidebar-separator"></div>
        ${sessionHistoryHTML}
      </div>
    </div>
    <div class="todo-section" id="todo-section">
      <div class="todo-header">
        <span class="user-notes-title">// Todos</span>
        <span class="todo-count" id="todo-count"></span>
      </div>
      <div class="todo-list" id="todo-list">
        <div class="user-notes-empty">Loading...</div>
      </div>
      <div class="todo-form" id="todo-form">
        <input type="text" id="todo-text" placeholder="Add a todo...">
        <input type="datetime-local" id="todo-due">
        <select id="todo-priority">
          <option value="none">—</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high" selected>High</option>
          <option value="critical">Critical</option>
        </select>
        <button id="todo-add-btn">Add</button>
      </div>
    </div>
    <div class="user-notes" id="user-notes" data-source="${escapeHtml(s.sourceFolder)}">
      <div class="user-notes-header">
        <span class="user-notes-title">// Notes</span>
        <div class="notes-tabs">
          <button class="notes-tab active" data-notes-filter="all">All</button>
          <button class="notes-tab" data-notes-filter="user">User</button>
          <button class="notes-tab" data-notes-filter="agent">Agent</button>
        </div>
        <span class="user-notes-count" id="notes-count"></span>
      </div>
      <div class="user-notes-entries" id="notes-entries">
        <div class="user-notes-empty">Loading...</div>
      </div>
      <div class="user-notes-form">
        <textarea id="notes-input" placeholder="Add a note for the next session..."></textarea>
        <button id="notes-submit">Post</button>
      </div>
    </div>
    ${timelineHTML}
    ${renderDetailSections(s)}
  `;
  detailScreen.classList.remove('hidden');
  appEl.classList.add('hidden');
  window.scrollTo(0, 0);

  // Priority select
  document.getElementById('priority-select').addEventListener('change', async (e) => {
    await fetch(`/api/sessions/${encodeURIComponent(s.file)}?source=${encodeURIComponent(s.sourceFolder)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: e.target.value }),
    });
    await fetchSessions();
  });

  // Activity timeline toggle
  const activityToggleBtn = document.getElementById('activity-toggle-btn');
  if (activityToggleBtn) {
    activityToggleBtn.addEventListener('click', () => {
      const hidden = document.getElementById('activity-hidden');
      if (hidden) {
        const isShown = hidden.style.display !== 'none';
        hidden.style.display = isShown ? 'none' : '';
        activityToggleBtn.textContent = isShown
          ? `Show all ${s.activityLog.length} entries`
          : 'Show recent only';
      }
    });
  }

  // Load tech stack
  loadTechStack(s.sourceFolder);

  // Load notes
  loadNotes(s.sourceFolder);

  // Wire up post button
  const notesSubmit = document.getElementById('notes-submit');
  const notesInput = document.getElementById('notes-input');
  notesSubmit.addEventListener('click', () => postNote(s.sourceFolder));
  notesInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postNote(s.sourceFolder);
  });

  // Load todos
  loadTodos(s.sourceFolder);

  // Wire up todo add button
  const todoAddBtn = document.getElementById('todo-add-btn');
  const todoTextInput = document.getElementById('todo-text');
  todoAddBtn.addEventListener('click', () => postTodo(s.sourceFolder));
  todoTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') postTodo(s.sourceFolder);
  });
}

function simpleMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^- \[x\]\s*(.+)$/gim, '<div class="task-item"><span class="task-check">&#10003;</span> <span style="text-decoration:line-through;opacity:0.5">$1</span></div>')
    .replace(/^- \[ \]\s*(.+)$/gm, '<div class="task-item"><span class="task-pending">&#9679;</span> <span>$1</span></div>')
    .replace(/^- \*\*(.+?):\*\* (.+)$/gm, '<div class="tech-item"><span class="tech-label">$1</span> <span class="tech-value">$2</span></div>')
    .replace(/^- (.+)$/gm, '<div style="padding:2px 0;color:var(--text-secondary)">&#8226; $1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/```([\s\S]*?)```/g, '<pre class="tech-tree">$1</pre>')
    .replace(/`([^`]+)`/g, '<code style="font-family:var(--font-mono);font-size:12px;color:var(--accent);border:1px solid var(--accent-border);padding:1px 5px;background:var(--accent-dim)">$1</code>')
    .replace(/\n\n/g, '<br>');
}

function renderDetailSections(s) {
  const showSections = ['Objective', 'Project Summary', 'Changes Made', 'Key Decisions', 'Blockers'];
  return showSections.map(name => {
    const content = s.sections?.[name];
    if (!content || content.trim() === '_None._' || content.trim().startsWith('_None')) return '';
    return `<div class="detail-section">
      <h2>${escapeHtml(name)}</h2>
      <div class="detail-section-content">${simpleMarkdown(content)}</div>
    </div>`;
  }).join('');
}

async function loadTechStack(sourceFolder) {
  const section = document.getElementById('tech-stack-section');
  const content = document.getElementById('tech-stack-content');
  const chevron = document.getElementById('tech-stack-chevron');
  const toggle = document.getElementById('tech-stack-toggle');
  try {
    const res = await fetch(`/api/tech-stack?source=${encodeURIComponent(sourceFolder)}`);
    const data = await res.json();
    if (!data.exists) return;
    section.style.display = 'block';

    // Build display from sections
    let html = '';
    if (data.sections['Stack']) {
      html += `<div class="tech-stack-items">${simpleMarkdown(data.sections['Stack'])}</div>`;
    }
    if (data.sections['Project Structure']) {
      html += `<div class="tech-stack-items"><h4>Project Structure</h4>${simpleMarkdown(data.sections['Project Structure'])}</div>`;
    }
    if (data.sections['Core Features']) {
      html += `<div class="tech-stack-items"><h4>Core Features</h4>${simpleMarkdown(data.sections['Core Features'])}</div>`;
    }
    if (data.sections['Recent Changes']) {
      html += `<div class="tech-stack-items"><h4>Recent Changes</h4>${simpleMarkdown(data.sections['Recent Changes'])}</div>`;
    }
    content.innerHTML = html;

    // Toggle expand/collapse
    toggle.addEventListener('click', () => {
      const isOpen = content.style.display !== 'none';
      content.style.display = isOpen ? 'none' : 'block';
      chevron.innerHTML = isOpen ? '&#9654;' : '&#9660;';
    });
  } catch (err) {
    console.error('Failed to load tech stack:', err);
  }
}

function closeDetail() {
  detailScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
}

let allNotes = [];
let activeNotesFilter = 'all';

function renderNoteEntries() {
  const entriesEl = document.getElementById('notes-entries');
  const countEl = document.getElementById('notes-count');
  const filtered = activeNotesFilter === 'all' ? allNotes : allNotes.filter(e => e.source === activeNotesFilter);

  if (filtered.length === 0) {
    entriesEl.innerHTML = `<div class="user-notes-empty">${allNotes.length === 0 ? 'No notes yet. Add one for the next session to pick up.' : 'No ' + activeNotesFilter + ' notes.'}</div>`;
    countEl.textContent = allNotes.length > 0 ? `${allNotes.length} note${allNotes.length > 1 ? 's' : ''}` : '';
  } else {
    countEl.textContent = `${filtered.length} note${filtered.length > 1 ? 's' : ''}`;
    entriesEl.innerHTML = filtered.map(e => {
      const isAgent = e.source === 'agent';
      const badgeClass = isAgent ? 'note-badge-agent' : 'note-badge-user';
      const badgeLabel = isAgent ? 'agent' : 'user';
      return `
        <div class="user-note-entry ${isAgent ? 'agent-note-entry' : ''}">
          <div class="user-note-time">
            <span class="note-badge ${badgeClass}">${badgeLabel}</span>
            ${escapeHtml(e.timestamp)}
          </div>
          <div class="user-note-body">${escapeHtml(e.body)}</div>
        </div>
      `;
    }).join('');
    entriesEl.scrollTop = entriesEl.scrollHeight;
  }
}

async function loadNotes(sourceFolder) {
  try {
    const res = await fetch(`/api/notes?source=${encodeURIComponent(sourceFolder)}`);
    const data = await res.json();
    allNotes = data.entries;
    activeNotesFilter = 'all';
    renderNoteEntries();

    // Wire up tabs
    document.querySelectorAll('.notes-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.notes-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeNotesFilter = tab.dataset.notesFilter;
        renderNoteEntries();
      });
    });
  } catch (err) {
    document.getElementById('notes-entries').innerHTML = `<div class="user-notes-empty" style="color:var(--red)">Failed to load notes</div>`;
  }
}

async function postNote(sourceFolder) {
  const input = document.getElementById('notes-input');
  const btn = document.getElementById('notes-submit');
  const text = input.value.trim();
  if (!text) return;

  btn.disabled = true;
  btn.textContent = 'Posting...';
  try {
    await fetch(`/api/notes?source=${encodeURIComponent(sourceFolder)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    input.value = '';
    await loadNotes(sourceFolder);
  } catch (err) {
    console.error('Failed to post note:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Post';
  }
}

// --- Todos ---
function todoCountdown(dueDate) {
  if (!dueDate) return '';
  const now = Date.now();
  const due = new Date(dueDate).getTime();
  const diff = due - now;
  if (diff < 0) return 'overdue';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 14) return `${Math.floor(days / 7)}w`;
  if (days > 1) return `${days}d`;
  if (hrs > 1) return `${hrs}h`;
  return `${mins}m`;
}

async function loadTodos(sourceFolder) {
  const listEl = document.getElementById('todo-list');
  const countEl = document.getElementById('todo-count');
  try {
    const res = await fetch(`/api/todos?source=${encodeURIComponent(sourceFolder)}`);
    const data = await res.json();
    const todos = data.todos || [];

    if (todos.length === 0) {
      listEl.innerHTML = '<div class="user-notes-empty">No todos yet.</div>';
      countEl.textContent = '';
      return;
    }

    const pending = todos.filter(t => t.status !== 'completed');
    const completed = todos.filter(t => t.status === 'completed');

    // Sort pending: overdue first, then by due date
    pending.sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return aDue - bDue;
    });

    const allSorted = [...pending, ...completed];
    const pendingCount = pending.length;
    const totalCount = todos.length;
    countEl.textContent = `${pendingCount} pending / ${totalCount} total`;

    listEl.innerHTML = allSorted.map(todo => {
      const isCompleted = todo.status === 'completed';
      const isOverdue = !isCompleted && todo.dueDate && new Date(todo.dueDate).getTime() < Date.now();
      const countdown = todoCountdown(todo.dueDate);
      const pCfg = PRIORITY_CONFIG[todo.priority || 'none'];
      const priorityBadge = pCfg && pCfg.label ? `<span style="font-family:var(--font-mono);font-size:10px;color:var(${pCfg.color})">${pCfg.label}</span>` : '';

      return `
        <div class="todo-item ${isOverdue ? 'todo-overdue' : ''} ${isCompleted ? 'todo-completed' : ''}">
          <button class="todo-check" data-id="${escapeHtml(todo.id)}" data-source="${escapeHtml(sourceFolder)}">
            ${isCompleted ? '\u2713' : '\u25CB'}
          </button>
          <div class="todo-content">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            ${todo.dueDate ? `<span class="todo-due ${isOverdue ? 'overdue' : ''}">${countdown}</span>` : ''}
          </div>
          ${priorityBadge}
          <button class="todo-delete" data-id="${escapeHtml(todo.id)}" data-source="${escapeHtml(sourceFolder)}">&times;</button>
        </div>`;
    }).join('');

    // Wire up check buttons
    listEl.querySelectorAll('.todo-check').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const src = btn.dataset.source;
        const todo = allSorted.find(t => t.id === id);
        const newStatus = todo && todo.status === 'completed' ? 'pending' : 'completed';
        await fetch(`/api/todos/${encodeURIComponent(id)}?source=${encodeURIComponent(src)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        loadTodos(sourceFolder);
      });
    });

    // Wire up delete buttons
    listEl.querySelectorAll('.todo-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const src = btn.dataset.source;
        await fetch(`/api/todos/${encodeURIComponent(id)}?source=${encodeURIComponent(src)}`, {
          method: 'DELETE',
        });
        loadTodos(sourceFolder);
      });
    });
  } catch (err) {
    listEl.innerHTML = '<div class="user-notes-empty" style="color:var(--red)">Failed to load todos</div>';
    console.error('Failed to load todos:', err);
  }
}

async function postTodo(sourceFolder) {
  const textInput = document.getElementById('todo-text');
  const dueInput = document.getElementById('todo-due');
  const priorityInput = document.getElementById('todo-priority');
  const addBtn = document.getElementById('todo-add-btn');
  const text = textInput.value.trim();
  if (!text) return;

  addBtn.disabled = true;
  addBtn.textContent = '...';
  try {
    await fetch(`/api/todos?source=${encodeURIComponent(sourceFolder)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        dueDate: dueInput.value || null,
        priority: priorityInput.value,
      }),
    });
    textInput.value = '';
    dueInput.value = '';
    await loadTodos(sourceFolder);
  } catch (err) {
    console.error('Failed to post todo:', err);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Add';
  }
}

// --- Calendar View ---
async function renderCalendarView(container) {
  // Fetch all todos across all projects
  try {
    const res = await fetch('/api/todos/all');
    const data = await res.json();
    calendarTodos = data.todos || [];
  } catch (err) {
    calendarTodos = [];
    console.error('Failed to fetch all todos:', err);
  }

  const now = calendarDate || new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

  // First day of month and days in month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Day of week for first day (0=Sun, adjust so Mon=0)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  // Days from previous month to fill
  const prevMonthLast = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  // Build day cells
  let cellsHTML = '';
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  for (let i = 0; i < totalCells; i++) {
    let dayNum, dateStr, isOtherMonth = false;
    if (i < startDow) {
      // Previous month
      dayNum = prevMonthLast - startDow + i + 1;
      const pm = month === 0 ? 11 : month - 1;
      const py = month === 0 ? year - 1 : year;
      dateStr = `${py}-${String(pm+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      isOtherMonth = true;
    } else if (i - startDow >= daysInMonth) {
      // Next month
      dayNum = i - startDow - daysInMonth + 1;
      const nm = month === 11 ? 0 : month + 1;
      const ny = month === 11 ? year + 1 : year;
      dateStr = `${ny}-${String(nm+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
      isOtherMonth = true;
    } else {
      dayNum = i - startDow + 1;
      dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    }

    const isToday = dateStr === todayStr;
    const isSelected = calendarSelectedDay === dateStr;

    // Find todos for this date
    const dayTodos = calendarTodos.filter(t => {
      if (!t.dueDate) return false;
      const dStr = t.dueDate.substring(0, 10);
      return dStr === dateStr;
    });

    const dotsHTML = dayTodos.map(t => {
      const isCompleted = t.status === 'completed';
      const isOverdue = !isCompleted && new Date(t.dueDate).getTime() < Date.now();
      const cls = isCompleted ? 'dot-completed' : (isOverdue ? 'dot-overdue' : 'dot-pending');
      return `<div class="calendar-dot ${cls}"></div>`;
    }).join('');

    cellsHTML += `
      <div class="calendar-cell ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''}" data-date="${dateStr}">
        <div class="calendar-date">${dayNum}</div>
        <div class="calendar-dots">${dotsHTML}</div>
      </div>`;
  }

  container.innerHTML = `
    <div class="calendar-header">
      <button class="calendar-nav" id="cal-prev">\u25C0</button>
      <div class="calendar-month">${monthNames[month]} ${year}</div>
      <button class="calendar-nav" id="cal-next">\u25B6</button>
    </div>
    <div class="calendar-grid">
      ${dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('')}
      ${cellsHTML}
    </div>
    <div id="calendar-day-detail"></div>
  `;

  // If a day is selected, show its detail
  if (calendarSelectedDay) {
    renderCalendarDayDetail(calendarSelectedDay);
  }

  // Wire up nav
  document.getElementById('cal-prev').addEventListener('click', () => {
    calendarDate = new Date(year, month - 1, 1);
    calendarSelectedDay = null;
    render();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    calendarDate = new Date(year, month + 1, 1);
    calendarSelectedDay = null;
    render();
  });

  // Wire up cell clicks
  container.querySelectorAll('.calendar-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      calendarSelectedDay = cell.dataset.date;
      // Update selected state visually
      container.querySelectorAll('.calendar-cell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      renderCalendarDayDetail(calendarSelectedDay);
    });
  });
}

function renderCalendarDayDetail(dateStr) {
  const detailEl = document.getElementById('calendar-day-detail');
  if (!detailEl) return;

  const dayTodos = calendarTodos.filter(t => {
    if (!t.dueDate) return false;
    return t.dueDate.substring(0, 10) === dateStr;
  });

  if (dayTodos.length === 0) {
    detailEl.innerHTML = `
      <div class="calendar-day-detail">
        <h3>${dateStr}</h3>
        <div class="user-notes-empty">No todos on this day.</div>
      </div>`;
    return;
  }

  const itemsHTML = dayTodos.map(t => {
    const isCompleted = t.status === 'completed';
    const isOverdue = !isCompleted && new Date(t.dueDate).getTime() < Date.now();
    const statusIcon = isCompleted ? '\u2713' : (isOverdue ? '\u25CF' : '\u25CB');
    const statusColor = isCompleted ? 'var(--accent)' : (isOverdue ? 'var(--red)' : 'var(--text-tertiary)');
    const pCfg = PRIORITY_CONFIG[t.priority || 'none'];
    const priorityBadge = pCfg && pCfg.label ? `<span style="font-family:var(--font-mono);font-size:10px;color:var(${pCfg.color})">${pCfg.label}</span>` : '';
    const sourceName = t.sourceName || t.source || '';

    return `
      <div class="calendar-todo-item" style="${isCompleted ? 'opacity:0.4;text-decoration:line-through' : ''} ${isOverdue ? 'color:var(--red)' : ''}">
        <span style="color:${statusColor};font-size:14px">${statusIcon}</span>
        <span style="flex:1;color:var(--text-secondary)">${escapeHtml(t.text)}</span>
        ${priorityBadge}
        ${sourceName ? `<span class="calendar-todo-source">${escapeHtml(sourceName)}</span>` : ''}
      </div>`;
  }).join('');

  detailEl.innerHTML = `
    <div class="calendar-day-detail">
      <h3>${dateStr} — ${dayTodos.length} todo${dayTodos.length > 1 ? 's' : ''}</h3>
      ${itemsHTML}
    </div>`;
}

function closeModal(overlay) { overlay.classList.remove('open'); }

// --- Settings ---
settingsBtn.addEventListener('click', () => { renderSettings(); settingsOverlay.classList.add('open'); });
settingsClose.addEventListener('click', () => closeModal(settingsOverlay));
settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeModal(settingsOverlay); });

function parseCSSValue(str) {
  const match = (str || '').match(/^([\d.]+)\s*(px|%|rem|em|vw)?$/);
  if (match) return { value: match[1], unit: match[2] || 'px' };
  return { value: str || '', unit: '' };
}

function renderFloatingSettings() {
  if (!currentConfig) return;
  const mw = parseCSSValue(currentConfig.maxWidth || '100%');
  if (!mw.unit) mw.unit = '%';
  const rg = parseCSSValue(currentConfig.rowGap || '0px');
  if (!rg.unit) rg.unit = 'px';
  const cg = parseCSSValue(currentConfig.columnGap || '0px');
  if (!cg.unit) cg.unit = 'px';
  const fontScale = currentConfig.fontScale || '100';
  const dw = parseCSSValue(currentConfig.detailMaxWidth || '900px');
  if (!dw.unit) dw.unit = 'px';

  const unitOptions = (selected) => ['%', 'px', 'rem', 'em', 'vw'].map(u =>
    `<option value="${u}"${u === selected ? ' selected' : ''}>${u}</option>`
  ).join('');

  floatingSettingsContent.innerHTML = `
    <div class="floating-field">
      <label>Max Width</label>
      <div class="floating-input-group">
        <input type="number" id="float-max-width-val" value="${escapeHtml(mw.value)}" min="0">
        <select id="float-max-width-unit">${unitOptions(mw.unit)}</select>
      </div>
    </div>
    <div class="floating-field">
      <label>Row Gap</label>
      <div class="floating-input-group">
        <input type="number" id="float-row-gap-val" value="${escapeHtml(rg.value)}" min="0">
        <select id="float-row-gap-unit">${unitOptions(rg.unit)}</select>
      </div>
    </div>
    <div class="floating-field">
      <label>Column Gap</label>
      <div class="floating-input-group">
        <input type="number" id="float-col-gap-val" value="${escapeHtml(cg.value)}" min="0">
        <select id="float-col-gap-unit">${unitOptions(cg.unit)}</select>
      </div>
    </div>
    <div class="floating-field">
      <label>Font Scale — <span id="float-font-scale-value">${escapeHtml(fontScale)}%</span></label>
      <input type="range" id="float-font-scale" min="70" max="150" step="5" value="${escapeHtml(fontScale)}" style="width:100%;accent-color:var(--accent)">
    </div>
    <div class="floating-field">
      <label>Detail Max Width</label>
      <div class="floating-input-group">
        <input type="number" id="float-detail-width-val" value="${escapeHtml(dw.value)}" min="0">
        <select id="float-detail-width-unit">${unitOptions(dw.unit)}</select>
      </div>
    </div>
    <button class="floating-apply-btn" id="float-apply-btn">Apply</button>
  `;

  const floatFontSlider = document.getElementById('float-font-scale');
  const floatFontValue = document.getElementById('float-font-scale-value');
  floatFontSlider.addEventListener('input', () => {
    floatFontValue.textContent = floatFontSlider.value + '%';
  });

  document.getElementById('float-apply-btn').addEventListener('click', async () => {
    const maxWidth = document.getElementById('float-max-width-val').value + document.getElementById('float-max-width-unit').value;
    const rowGap = document.getElementById('float-row-gap-val').value + document.getElementById('float-row-gap-unit').value;
    const columnGap = document.getElementById('float-col-gap-val').value + document.getElementById('float-col-gap-unit').value;
    const fs = floatFontSlider.value || '100';
    const detailMaxWidth = document.getElementById('float-detail-width-val').value + document.getElementById('float-detail-width-unit').value;
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentConfig, maxWidth, rowGap, columnGap, fontScale: fs, detailMaxWidth }),
    });
    applyDisplaySettings({ maxWidth, rowGap, columnGap, fontScale: fs, detailMaxWidth });
    await refreshConfig();
  });
}

function renderSettings() {
  if (!currentConfig) return;
  const mode = currentConfig.mode || 'not configured';
  const folders = currentConfig.mode === 'shared' ? [currentConfig.sharedFolder] : (currentConfig.watchFolders || []);
  const isIndividual = currentConfig.mode === 'individual';

  settingsBody.innerHTML = `
    <div class="settings-section">
      <h3>Mode</h3>
      <span class="settings-mode-display">${escapeHtml(mode)}</span>
    </div>
    <div class="settings-section">
      <h3>Watched Folders</h3>
      <ul class="settings-folders" id="settings-folder-list">
        ${folders.map(f => `
          <li><span>${escapeHtml(f)}</span>${isIndividual ? `<button class="remove-btn" data-folder="${escapeHtml(f)}">&times;</button>` : ''}</li>
        `).join('')}
      </ul>
      ${isIndividual ? `
        <div class="settings-folder-add">
          <input type="text" class="wizard-input" id="settings-new-folder" placeholder="Add folder path...">
          <button class="wizard-add-btn" id="settings-add-folder-btn">Add</button>
        </div>` : ''}
    </div>
    ${isIndividual ? `
    <div class="settings-section">
      <h3>Discover Projects</h3>
      <div class="settings-folder-add">
        <input type="text" class="wizard-input" id="settings-discover-input" placeholder="Root folder to scan...">
        <button class="wizard-add-btn" id="settings-discover-add-root">Add</button>
        <button class="wizard-add-btn" id="settings-discover-btn">Scan All</button>
      </div>
      <ul class="settings-folders" id="settings-discover-roots-list">
        ${(currentConfig.discoverRoots || []).map(r => `
          <li><span>${escapeHtml(r)}</span><button class="remove-btn settings-discover-root-remove" data-root="${escapeHtml(r)}">&times;</button></li>
        `).join('')}
      </ul>
      <p class="wizard-hint">Add root folders containing your projects, then scan to find ones with CLAUDE.md.</p>
      <div id="settings-discover-results"></div>
    </div>` : ''}
    <div class="settings-section">
      <h3>Display</h3>
      <label class="form-label" style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;display:block">Max Width</label>
      <div class="floating-input-group" style="margin-bottom:4px">
        <input type="number" id="settings-max-width-val" value="${escapeHtml(parseCSSValue(currentConfig.maxWidth || '100%').value)}" min="0">
        <select id="settings-max-width-unit">${['%','px','rem','em','vw'].map(u => '<option value="' + u + '"' + (parseCSSValue(currentConfig.maxWidth || '100%').unit === u || (!parseCSSValue(currentConfig.maxWidth || '100%').unit && u === '%') ? ' selected' : '') + '>' + u + '</option>').join('')}</select>
      </div>
      <p class="wizard-hint">Dashboard max width. Use 100% for full width or a px value like 1400px.</p>

      <label class="form-label" style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;margin-top:16px;display:block">Row Gap</label>
      <div class="floating-input-group" style="margin-bottom:4px">
        <input type="number" id="settings-row-gap-val" value="${escapeHtml(parseCSSValue(currentConfig.rowGap || '0px').value)}" min="0">
        <select id="settings-row-gap-unit">${['%','px','rem','em','vw'].map(u => '<option value="' + u + '"' + (parseCSSValue(currentConfig.rowGap || '0px').unit === u || (!parseCSSValue(currentConfig.rowGap || '0px').unit && u === 'px') ? ' selected' : '') + '>' + u + '</option>').join('')}</select>
      </div>

      <label class="form-label" style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;margin-top:16px;display:block">Column Gap</label>
      <div class="floating-input-group" style="margin-bottom:4px">
        <input type="number" id="settings-column-gap-val" value="${escapeHtml(parseCSSValue(currentConfig.columnGap || '0px').value)}" min="0">
        <select id="settings-column-gap-unit">${['%','px','rem','em','vw'].map(u => '<option value="' + u + '"' + (parseCSSValue(currentConfig.columnGap || '0px').unit === u || (!parseCSSValue(currentConfig.columnGap || '0px').unit && u === 'px') ? ' selected' : '') + '>' + u + '</option>').join('')}</select>
      </div>

      <label class="form-label" style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;margin-top:16px;display:block">Font Scale — <span id="font-scale-value">${escapeHtml(currentConfig.fontScale || '100')}%</span></label>
      <div style="display:flex;align-items:center;gap:12px">
        <input type="range" id="settings-font-scale" min="70" max="150" step="5" value="${escapeHtml(currentConfig.fontScale || '100')}" style="flex:1;accent-color:var(--accent)">
      </div>
      <p class="wizard-hint">Scale all text sizes (70%&ndash;150%).</p>

      <label class="form-label" style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;margin-top:16px;display:block">Detail Max Width</label>
      <div class="floating-input-group" style="margin-bottom:4px">
        <input type="number" id="settings-detail-width-val" value="${escapeHtml(parseCSSValue(currentConfig.detailMaxWidth || '900px').value)}" min="0">
        <select id="settings-detail-width-unit">${['%','px','rem','em','vw'].map(u => '<option value="' + u + '"' + (parseCSSValue(currentConfig.detailMaxWidth || '900px').unit === u || (!parseCSSValue(currentConfig.detailMaxWidth || '900px').unit && u === 'px') ? ' selected' : '') + '>' + u + '</option>').join('')}</select>
      </div>
      <p class="wizard-hint">Max width for the detail view. Default is 900px.</p>

      <button class="wizard-add-btn" id="settings-save-display" style="margin-top:16px">Apply</button>
    </div>
    <div class="settings-section">
      <h3>Reset</h3>
      <button class="settings-reset-btn" id="settings-reset-btn">Reset Configuration</button>
      <p class="wizard-hint" style="margin-top:0.4rem">This will clear your config and show the setup wizard again.</p>
    </div>`;

  if (isIndividual) {
    const addBtn = document.getElementById('settings-add-folder-btn');
    const input = document.getElementById('settings-new-folder');
    addBtn.addEventListener('click', async () => {
      const val = input.value.trim();
      if (!val) return;
      await fetch('/api/config/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: val }) });
      input.value = '';
      await refreshConfig();
      renderSettings();
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });

    document.querySelectorAll('#settings-folder-list .remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch('/api/config/folders', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: btn.dataset.folder }) });
        await refreshConfig();
        renderSettings();
      });
    });

    const discoverBtn = document.getElementById('settings-discover-btn');
    const discoverAddRoot = document.getElementById('settings-discover-add-root');
    const discoverInput = document.getElementById('settings-discover-input');
    const discoverRootsList = document.getElementById('settings-discover-roots-list');
    const discoverResults = document.getElementById('settings-discover-results');

    // Remove discover root
    discoverRootsList.querySelectorAll('.settings-discover-root-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const roots = (currentConfig.discoverRoots || []).filter(r => r !== btn.dataset.root);
        await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...currentConfig, discoverRoots: roots }) });
        await refreshConfig();
        renderSettings();
      });
    });

    // Add discover root
    if (discoverAddRoot) {
      discoverAddRoot.addEventListener('click', async () => {
        const val = discoverInput.value.trim();
        if (!val) return;
        const roots = [...(currentConfig.discoverRoots || [])];
        if (!roots.includes(val)) {
          roots.push(val);
          await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...currentConfig, discoverRoots: roots }) });
          await refreshConfig();
        }
        discoverInput.value = '';
        renderSettings();
      });
      discoverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') discoverAddRoot.click(); });
    }

    if (discoverBtn) {
      discoverBtn.addEventListener('click', async () => {
        const roots = currentConfig.discoverRoots || [];
        if (roots.length === 0) return;
        discoverBtn.textContent = 'Scanning...';
        discoverBtn.disabled = true;
        try {
          let allProjects = [];
          for (const root of roots) {
            const res = await fetch(`/api/discover?root=${encodeURIComponent(root)}`);
            const data = await res.json();
            if (res.ok) allProjects.push(...data.projects);
          }
          const currentFolders = currentConfig.watchFolders || [];
          discoverResults.innerHTML = `
            <ul class="discover-list" style="margin-top:0.75rem">
              ${allProjects.map(p => {
                const added = currentFolders.some(f => f === p.sessionsPath || f === p.sessionsPath.replace(/\//g, '\\'));
                const badges = [];
                if (p.hasClaude) badges.push('<span class="discover-badge claude">CLAUDE.md</span>');
                if (p.sessionCount > 0) badges.push('<span class="discover-badge sessions">' + p.sessionCount + ' session' + (p.sessionCount > 1 ? 's' : '') + '</span>');
                return '<li class="discover-item"><div class="discover-item-info"><div class="discover-item-name">' + escapeHtml(p.name) + '</div><div class="discover-item-path">' + escapeHtml(p.sessionsPath) + '</div></div><div class="discover-item-badges">' + badges.join('') + '</div>' + (added ? '<span style="color:var(--accent);font-size:0.75rem;font-family:var(--font-mono)">added</span>' : '<button class="wizard-add-btn settings-discover-add" data-path="' + escapeHtml(p.sessionsPath) + '" style="padding:0.2rem 0.6rem;font-size:0.72rem">Add</button>') + '</li>';
              }).join('')}
            </ul>`;
          discoverResults.querySelectorAll('.settings-discover-add').forEach(btn => {
            btn.addEventListener('click', async () => {
              await fetch('/api/config/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: btn.dataset.path }) });
              await refreshConfig();
              renderSettings();
            });
          });
        } catch (err) {
          discoverResults.innerHTML = `<p style="color:var(--red);font-size:0.82rem;margin-top:0.5rem">${escapeHtml(err.message)}</p>`;
        } finally {
          discoverBtn.textContent = 'Scan All';
          discoverBtn.disabled = false;
        }
      });
    }
  }

  // Display settings
  const fontScaleSlider = document.getElementById('settings-font-scale');
  const fontScaleValue = document.getElementById('font-scale-value');
  fontScaleSlider.addEventListener('input', () => {
    fontScaleValue.textContent = fontScaleSlider.value + '%';
  });

  document.getElementById('settings-save-display').addEventListener('click', async () => {
    const maxWidth = (document.getElementById('settings-max-width-val').value || '100') + (document.getElementById('settings-max-width-unit').value || '%');
    const rowGap = (document.getElementById('settings-row-gap-val').value || '0') + (document.getElementById('settings-row-gap-unit').value || 'px');
    const columnGap = (document.getElementById('settings-column-gap-val').value || '0') + (document.getElementById('settings-column-gap-unit').value || 'px');
    const fontScale = fontScaleSlider.value || '100';
    const detailMaxWidth = (document.getElementById('settings-detail-width-val').value || '900') + (document.getElementById('settings-detail-width-unit').value || 'px');
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentConfig, maxWidth, rowGap, columnGap, fontScale, detailMaxWidth }),
    });
    applyDisplaySettings({ maxWidth, rowGap, columnGap, fontScale, detailMaxWidth });
    await refreshConfig();
  });

  document.getElementById('settings-reset-btn').addEventListener('click', async () => {
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: null }) });
    location.reload();
  });
}

async function refreshConfig() {
  const res = await fetch('/api/config');
  currentConfig = await res.json();
}

function applyDisplaySettings(cfg) {
  const root = document.documentElement.style;
  root.setProperty('--layout-max-width', cfg.maxWidth || '100%');
  root.setProperty('--grid-row-gap', cfg.rowGap || '0px');
  root.setProperty('--grid-column-gap', cfg.columnGap || '0px');
  root.setProperty('--detail-max-width', cfg.detailMaxWidth || '900px');
  root.setProperty('--font-scale', (parseInt(cfg.fontScale, 10) || 100) / 100);
  document.body.style.zoom = (parseInt(cfg.fontScale, 10) || 100) / 100;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Events ---
detailBack.addEventListener('click', closeDetail);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!detailScreen.classList.contains('hidden')) closeDetail();
    closeModal(settingsOverlay);
    if (!floatingSettingsPanel.classList.contains('hidden')) {
      floatingSettingsPanel.classList.add('hidden');
    }
  }
});

floatingSettingsBtn.addEventListener('click', () => {
  const isHidden = floatingSettingsPanel.classList.contains('hidden');
  if (isHidden) {
    renderFloatingSettings();
    floatingSettingsPanel.classList.remove('hidden');
  } else {
    floatingSettingsPanel.classList.add('hidden');
  }
});

floatingSettingsClose.addEventListener('click', () => {
  floatingSettingsPanel.classList.add('hidden');
});

filtersContainer.addEventListener('click', (e) => {
  if (!e.target.classList.contains('filter-btn')) return;
  filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  activeFilter = e.target.dataset.filter;
  render();
});

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  render();
});

viewToggle.addEventListener('click', (e) => {
  const btn = e.target.closest('.view-btn');
  if (!btn) return;
  viewToggle.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentView = btn.dataset.view;
  render();
});

const evtSource = new EventSource('/api/events');
evtSource.onmessage = () => fetchSessions();

init();
