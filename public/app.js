// --- State ---
let sessions = [];
let activeFilter = 'all';
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
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
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
  grid.innerHTML = filtered.map(s => cardHTML(s)).join('');
  grid.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', () => {
      const session = sessions.find(s => s.file === card.dataset.file && s.sourceFolder === card.dataset.source);
      if (session) openModal(session);
    });
  });
}

function statusColorVar(status) {
  return { in_progress: '--neon-blue', completed: '--neon-green', blocked: '--neon-yellow', failed: '--neon-red', not_started: '--text-muted' }[status] || '--text-muted';
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
    const more = pendingTasks.length > 3 ? `<div style="font-size:0.7rem;color:var(--text-muted);padding-left:1rem;margin-top:0.15rem">+${pendingTasks.length - 3} more</div>` : '';
    nextUpHTML = `
      <div class="card-next-up">
        <div class="card-next-up-title">&gt; next up</div>
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
  const latestHTML = latest ? `<div class="card-latest"><span>&gt;</span> ${escapeHtml(latest.title)}</div>` : '';

  // Notes
  const notesHTML = notesPreview && notesPreview !== '_None._' && !notesPreview.startsWith('_None')
    ? `<div class="card-notes">"${escapeHtml(notesPreview)}${notesPreview.length >= 120 ? '...' : ''}"</div>` : '';

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
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${glowClass(status)}" style="width:${progress}%"></div>
      </div>
      <div class="progress-info">
        <span>${s.tasks.done}/${s.tasks.total} tasks</span>
        <span>${progress}%</span>
      </div>
      ${nextUpHTML}
      ${doneHTML}
      ${latestHTML}
      ${notesHTML}
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    </div>`;
}

// --- Modal ---
function openModal(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (progress / 100) * circumference;
  const colorVar = statusColorVar(status);

  const isMidProject = s.tracking_start === 'mid_project';
  let midProjectNotice = isMidProject ? `
    <div class="mid-project-notice">
      <div class="mid-project-label">&gt; mid-project tracking</div>
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
      <h2 style="color:var(--neon-blue);margin-top:1.5rem;margin-bottom:0.75rem;">Activity Timeline</h2>
      ${isMidProject ? '<div class="timeline-partial-notice">// from tracking start point only</div>' : ''}
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
        <div class="card-next-up-title">&gt; remaining tasks (${pendingTasks.length})</div>
        ${pendingTasks.map(t => `<div class="task-item"><span class="task-pending">&#9679;</span> <span>${escapeHtml(t)}</span></div>`).join('')}
      </div>`;
  }

  let notesTopHTML = '';
  if (notesSection.trim() && !notesSection.trim().startsWith('_None')) {
    notesTopHTML = `
      <div class="card-notes" style="margin-bottom:1rem;border-top:none;border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem">
        <div style="font-family:var(--font-mono);font-size:0.68rem;color:var(--neon-purple);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.35rem;font-weight:700;font-style:normal">&gt; handoff notes</div>
        <div style="font-style:normal;color:var(--text);font-size:0.82rem;line-height:1.5">${escapeHtml(notesSection.trim())}</div>
      </div>`;
  }

  modalBody.innerHTML = `
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
        <svg width="72" height="72">
          <circle class="progress-ring-bg" cx="36" cy="36" r="30"/>
          <circle class="progress-ring-fill" cx="36" cy="36" r="30"
            style="stroke:var(${colorVar});stroke-dasharray:${circumference};stroke-dashoffset:${offset}"/>
        </svg>
        <div class="progress-ring-text">${progress}%</div>
      </div>
      <div>
        <div style="font-weight:700;color:var(--text-bright)">${s.tasks.done} of ${s.tasks.total} tasks complete</div>
        <div style="font-size:0.8rem;color:var(--text-muted);font-family:var(--font-mono)">${s.tasks.total - s.tasks.done} remaining</div>
      </div>
    </div>
    ${pendingHTML}
    ${notesTopHTML}
    ${timelineHTML}
    <div class="session-content">${s.html}</div>
  `;
  modalOverlay.classList.add('open');
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
          if (!res.ok) { discoverResults.innerHTML = `<p style="color:var(--neon-red);font-size:0.82rem;margin-top:0.5rem">${escapeHtml(data.error)}</p>`; return; }
          const currentFolders = currentConfig.watchFolders || [];
          discoverResults.innerHTML = `
            <ul class="discover-list" style="margin-top:0.75rem">
              ${data.projects.map(p => {
                const added = currentFolders.some(f => f === p.sessionsPath || f === p.sessionsPath.replace(/\//g, '\\'));
                const badges = [];
                if (p.hasClaude) badges.push('<span class="discover-badge claude">CLAUDE.md</span>');
                if (p.sessionCount > 0) badges.push('<span class="discover-badge sessions">' + p.sessionCount + ' session' + (p.sessionCount > 1 ? 's' : '') + '</span>');
                return '<li class="discover-item"><div class="discover-item-info"><div class="discover-item-name">' + escapeHtml(p.name) + '</div><div class="discover-item-path">' + escapeHtml(p.sessionsPath) + '</div></div><div class="discover-item-badges">' + badges.join('') + '</div>' + (added ? '<span style="color:var(--neon-green);font-size:0.75rem;font-family:var(--font-mono)">added</span>' : '<button class="wizard-add-btn settings-discover-add" data-path="' + escapeHtml(p.sessionsPath) + '" style="padding:0.2rem 0.6rem;font-size:0.72rem">Add</button>') + '</li>';
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
          discoverResults.innerHTML = `<p style="color:var(--neon-red);font-size:0.82rem;margin-top:0.5rem">${escapeHtml(err.message)}</p>`;
        } finally {
          discoverBtn.textContent = 'Scan';
          discoverBtn.disabled = false;
        }
      });
      discoverInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') discoverBtn.click(); });
    }
  }

  document.getElementById('settings-reset-btn').addEventListener('click', async () => {
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: null }) });
    location.reload();
  });
}

async function refreshConfig() {
  const res = await fetch('/api/config');
  currentConfig = await res.json();
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Events ---
modalClose.addEventListener('click', () => closeModal(modalOverlay));
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(modalOverlay); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(modalOverlay); closeModal(settingsOverlay); } });

filtersContainer.addEventListener('click', (e) => {
  if (!e.target.classList.contains('filter-btn')) return;
  filtersContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  activeFilter = e.target.dataset.filter;
  render();
});

const evtSource = new EventSource('/api/events');
evtSource.onmessage = () => fetchSessions();

init();
