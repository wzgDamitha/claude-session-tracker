// --- State ---
let sessions = [];
let activeFilter = 'all';
let currentView = 'grid';
let currentConfig = null;

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
const detailScreen = document.getElementById('detail-screen');
const detailBody = document.getElementById('detail-body');
const detailBack = document.getElementById('detail-back');
const viewToggle = document.getElementById('view-toggle');
const filtersContainer = document.getElementById('filters');

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
const wizardDiscoverBtn = document.getElementById('wizard-discover-btn');
const wizardDiscoverResults = document.getElementById('wizard-discover-results');
const wizardDiscoverList = document.getElementById('wizard-discover-list');
const wizardSelectAll = document.getElementById('wizard-select-all');

wizardDiscoverBtn.addEventListener('click', async () => {
  const root = wizardDiscoverInput.value.trim();
  if (!root) return;
  wizardDiscoverBtn.textContent = 'Scanning...';
  wizardDiscoverBtn.disabled = true;
  try {
    const res = await fetch(`/api/discover?root=${encodeURIComponent(root)}`);
    const data = await res.json();
    if (!res.ok) { showWizardError(data.error || 'Scan failed'); return; }
    discoveredProjects = data.projects;
    renderDiscoverResults();
    wizardDiscoverResults.classList.remove('hidden');
  } catch (err) {
    showWizardError('Connection error: ' + err.message);
  } finally {
    wizardDiscoverBtn.textContent = 'Scan';
    wizardDiscoverBtn.disabled = false;
  }
});

wizardDiscoverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') wizardDiscoverBtn.click(); });

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
    body.discoverRoot = wizardDiscoverInput.value.trim();
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
      applyMaxWidth(currentConfig.maxWidth);
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
  const filtered = activeFilter === 'all' ? sessions : sessions.filter(s => s.status === activeFilter);

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

  if (currentView === 'list') {
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
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
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
  const modeLabel = s.update_mode ? `<span class="update-mode-tag">${escapeHtml(s.update_mode)}</span>` : '';
  const trackingLabel = s.tracking_start === 'mid_project' ? '<span class="tracking-badge tracking-mid">mid-project</span>'
    : s.tracking_start === 'full' ? '<span class="tracking-badge tracking-full">full</span>' : '';
  const sessionCountLabel = s.sessionCount ? `<span class="session-count-tag">${s.sessionCount} sess</span>` : '';

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
        <span class="card-title">${escapeHtml(s.title || s.file)}</span>
        <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      </div>
      <div class="card-meta">
        ${sourceLabel}${trackingLabel}${sessionCountLabel}${modeLabel}
        ${s.current_branch || s.branch ? `<span>&#9702; ${escapeHtml(s.current_branch || s.branch)}</span>` : ''}
        ${s.updated_at ? `<span>${timeAgo(s.updated_at)} ago</span>` : ''}
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
      <div><span class="status-badge status-${status}">${status.replace('_', ' ')}</span></div>
      <div class="list-row-tasks">${s.tasks.done}/${s.tasks.total}</div>
      <div class="list-row-time">${s.updated_at ? timeAgo(s.updated_at) + ' ago' : ''}</div>
    </div>`;
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
    timelineHTML = `
      <h2 style="color:var(--accent);margin-top:1.5rem;margin-bottom:0.75rem;">Activity Timeline</h2>
      ${isMidProject ? '<div class="timeline-partial-notice">// activity from tracking start point only</div>' : ''}
      <div class="activity-timeline">
        ${s.activityLog.map(entry => {
          const isBoundary = entry.type === 'session_start' || entry.type === 'session_end';
          return `
            <div class="activity-entry ${isBoundary ? 'activity-boundary' : ''}">
              <div class="activity-time">${escapeHtml(entry.timestamp)}</div>
              <div class="activity-title">${escapeHtml(entry.title)}</div>
              ${entry.body ? `<div class="activity-body">${escapeHtml(entry.body)}</div>` : ''}
            </div>`;
        }).join('')}
      </div>`;
  }

  // Pending tasks for modal top
  const tasksSection = s.sections?.['Tasks'] || '';
  const allTasks = tasksSection.split('\n').filter(l => /^- \[[ x]\]/i.test(l));
  const pendingTasks = allTasks.filter(l => /^- \[ \]/.test(l)).map(l => l.replace(/^- \[ \]\s*/i, ''));
  const notesSection = s.sections?.['Notes'] || '';

  let pendingHTML = '';
  if (pendingTasks.length > 0) {
    pendingHTML = `
      <div class="card-next-up" style="margin-bottom:1rem">
        <div class="card-next-up-title">// remaining tasks (${pendingTasks.length})</div>
        ${pendingTasks.map(t => `<div class="task-item"><span class="task-pending">&#9679;</span> <span>${escapeHtml(t)}</span></div>`).join('')}
      </div>`;
  }

  let notesTopHTML = '';
  if (notesSection.trim() && !notesSection.trim().startsWith('_None')) {
    notesTopHTML = `
      <div class="card-notes" style="margin-bottom:1rem;border-top:none;border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem">
        <div style="font-family:var(--font-mono);font-size:10px;color:var(--purple);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;font-weight:700;font-style:normal">// handoff notes</div>
        <div style="font-style:normal;color:var(--text-secondary);font-size:13px;line-height:1.6">${escapeHtml(notesSection.trim())}</div>
      </div>`;
  }

  detailBody.innerHTML = `
    <h2>${escapeHtml(s.title || s.file)}</h2>
    <div class="modal-meta">
      <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      ${s.repository ? `<span>${escapeHtml(s.repository)}</span>` : ''}
      ${s.agent_model ? `<span>${escapeHtml(s.agent_model)}</span>` : ''}
      ${s.update_mode ? `<span class="update-mode-tag">${escapeHtml(s.update_mode)}</span>` : ''}
      ${s.tracking_start === 'mid_project' ? '<span class="tracking-badge tracking-mid">mid-project</span>' : ''}
      ${s.tracking_start === 'full' ? '<span class="tracking-badge tracking-full">full</span>' : ''}
      ${s.sessionCount ? `<span class="session-count-tag">${s.sessionCount} session${s.sessionCount > 1 ? 's' : ''}</span>` : ''}
      ${s.sourceName ? `<span class="source-tag">${escapeHtml(s.sourceName)}</span>` : ''}
      ${s.current_session ? `<span>current: ${escapeHtml(s.current_session)}</span>` : ''}
      ${s.current_branch || s.branch ? `<span>&#9702; ${escapeHtml(s.current_branch || s.branch)}</span>` : ''}
      ${s.created_at ? `<span>since ${new Date(s.created_at).toLocaleDateString()}</span>` : ''}
      ${s.updated_at ? `<span>updated ${new Date(s.updated_at).toLocaleString()}</span>` : ''}
    </div>
    ${midProjectNotice}
    ${sessionHistoryHTML}
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
        <div style="font-weight:700;color:var(--text-primary)">${s.tasks.done} of ${s.tasks.total} tasks complete</div>
        <div style="font-size:13px;color:var(--text-tertiary);font-family:var(--font-mono)">${s.tasks.total - s.tasks.done} remaining</div>
      </div>
    </div>
    ${pendingHTML}
    ${notesTopHTML}
    <div class="user-notes" id="user-notes" data-source="${escapeHtml(s.sourceFolder)}">
      <div class="user-notes-header">
        <span class="user-notes-title">// User Notes</span>
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
    <div class="session-content">${s.html}</div>
  `;
  detailScreen.classList.remove('hidden');
  appEl.classList.add('hidden');
  window.scrollTo(0, 0);

  // Load notes
  loadNotes(s.sourceFolder);

  // Wire up post button
  const notesSubmit = document.getElementById('notes-submit');
  const notesInput = document.getElementById('notes-input');
  notesSubmit.addEventListener('click', () => postNote(s.sourceFolder));
  notesInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) postNote(s.sourceFolder);
  });
}

function closeDetail() {
  detailScreen.classList.add('hidden');
  appEl.classList.remove('hidden');
}

async function loadNotes(sourceFolder) {
  const entriesEl = document.getElementById('notes-entries');
  const countEl = document.getElementById('notes-count');
  try {
    const res = await fetch(`/api/notes?source=${encodeURIComponent(sourceFolder)}`);
    const data = await res.json();
    if (data.entries.length === 0) {
      entriesEl.innerHTML = '<div class="user-notes-empty">No notes yet. Add one for the next session to pick up.</div>';
      countEl.textContent = '';
    } else {
      countEl.textContent = `${data.entries.length} note${data.entries.length > 1 ? 's' : ''}`;
      entriesEl.innerHTML = data.entries.map(e => `
        <div class="user-note-entry">
          <div class="user-note-time">${escapeHtml(e.timestamp)}</div>
          <div class="user-note-body">${escapeHtml(e.body)}</div>
        </div>
      `).join('');
      entriesEl.scrollTop = entriesEl.scrollHeight;
    }
  } catch (err) {
    entriesEl.innerHTML = `<div class="user-notes-empty" style="color:var(--red)">Failed to load notes</div>`;
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

function closeModal(overlay) { overlay.classList.remove('open'); }

// --- Settings ---
settingsBtn.addEventListener('click', () => { renderSettings(); settingsOverlay.classList.add('open'); });
settingsClose.addEventListener('click', () => closeModal(settingsOverlay));
settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeModal(settingsOverlay); });

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
        <input type="text" class="wizard-input" id="settings-discover-input" placeholder="Root folder to scan..." value="${escapeHtml(currentConfig.discoverRoot || '')}">
        <button class="wizard-add-btn" id="settings-discover-btn">Scan</button>
      </div>
      <p class="wizard-hint">Scan a root folder for projects with CLAUDE.md and add them.</p>
      <div id="settings-discover-results"></div>
    </div>` : ''}
    <div class="settings-section">
      <h3>Layout</h3>
      <label class="form-label" style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;display:block">Max Width</label>
      <div class="settings-folder-add">
        <input type="text" class="wizard-input" id="settings-max-width" value="${escapeHtml(currentConfig.maxWidth || '100%')}" placeholder="e.g. 100%, 1400px, 1200px">
        <button class="wizard-add-btn" id="settings-save-width">Apply</button>
      </div>
      <p class="wizard-hint">Set the max width of the dashboard layout. Use 100% for full width or a px value like 1400px.</p>
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
    const discoverInput = document.getElementById('settings-discover-input');
    const discoverResults = document.getElementById('settings-discover-results');
    if (discoverBtn) {
      discoverBtn.addEventListener('click', async () => {
        const root = discoverInput.value.trim();
        if (!root) return;
        discoverBtn.textContent = 'Scanning...';
        discoverBtn.disabled = true;
        try {
          const res = await fetch(`/api/discover?root=${encodeURIComponent(root)}`);
          const data = await res.json();
          if (!res.ok) { discoverResults.innerHTML = `<p style="color:var(--red);font-size:0.82rem;margin-top:0.5rem">${escapeHtml(data.error)}</p>`; return; }
          const currentFolders = currentConfig.watchFolders || [];
          discoverResults.innerHTML = `
            <ul class="discover-list" style="margin-top:0.75rem">
              ${data.projects.map(p => {
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
              await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...currentConfig, discoverRoot: root }) });
              await refreshConfig();
              renderSettings();
            });
          });
        } catch (err) {
          discoverResults.innerHTML = `<p style="color:var(--red);font-size:0.82rem;margin-top:0.5rem">${escapeHtml(err.message)}</p>`;
        } finally {
          discoverBtn.textContent = 'Scan';
          discoverBtn.disabled = false;
        }
      });
      discoverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') discoverBtn.click(); });
    }
  }

  // Max width
  document.getElementById('settings-save-width').addEventListener('click', async () => {
    const val = document.getElementById('settings-max-width').value.trim() || '100%';
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...currentConfig, maxWidth: val }),
    });
    applyMaxWidth(val);
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

function applyMaxWidth(value) {
  const v = value || '100%';
  document.documentElement.style.setProperty('--layout-max-width', v);
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
  }
});

filtersContainer.addEventListener('click', (e) => {
  if (!e.target.classList.contains('filter-btn')) return;
  filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  activeFilter = e.target.dataset.filter;
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
