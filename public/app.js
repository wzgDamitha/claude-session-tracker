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

document.querySelectorAll('.wizard-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    wizardMode = btn.dataset.mode;
    document.querySelectorAll('.wizard-mode-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Go to step 2
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

// Individual folder management
function renderWizardFolders() {
  wizardFolderList.innerHTML = wizardFolders.map((f, i) => `
    <li>
      <span>${escapeHtml(f)}</span>
      <button class="remove-btn" data-index="${i}">&times;</button>
    </li>
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

wizardFolderInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') wizardAddBtn.click();
});

// Save config
wizardSaveBtn.addEventListener('click', async () => {
  wizardError.classList.add('hidden');
  wizardSaveBtn.disabled = true;

  const body = { mode: wizardMode };

  if (wizardMode === 'shared') {
    const folder = wizardSharedInput.value.trim();
    if (!folder) {
      showWizardError('Please enter a folder path.');
      return;
    }
    body.sharedFolder = folder;
  } else {
    if (wizardFolders.length === 0) {
      showWizardError('Please add at least one folder.');
      return;
    }
    body.watchFolders = wizardFolders;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      showWizardError(data.error || 'Failed to save config');
      return;
    }
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

// --- Init: check config ---
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

// --- Fetch sessions ---
async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    sessions = await res.json();
    render();
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  }
}

// --- Render dashboard ---
function render() {
  const filtered = activeFilter === 'all'
    ? sessions
    : sessions.filter(s => s.status === activeFilter);

  // Header stats
  const counts = {};
  for (const s of sessions) {
    counts[s.status] = (counts[s.status] || 0) + 1;
  }
  headerStats.innerHTML = `
    <span class="stat"><span class="stat-dot" style="background:var(--accent)"></span> ${counts.in_progress || 0} active</span>
    <span class="stat"><span class="stat-dot" style="background:var(--green)"></span> ${counts.completed || 0} done</span>
    <span class="stat"><span class="stat-dot" style="background:var(--yellow)"></span> ${counts.blocked || 0} blocked</span>
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
      const file = card.dataset.file;
      const source = card.dataset.source;
      const session = sessions.find(s => s.file === file && s.sourceFolder === source);
      if (session) openModal(session);
    });
  });
}

function statusColor(status) {
  const map = {
    in_progress: 'var(--accent)',
    completed: 'var(--green)',
    blocked: 'var(--yellow)',
    failed: 'var(--red)',
    not_started: 'var(--text-muted)',
  };
  return map[status] || 'var(--text-muted)';
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function cardHTML(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;

  const tasksSection = s.sections?.['Tasks'] || '';
  const taskLines = tasksSection.split('\n').filter(l => l.match(/^- \[[ x]\]/i)).slice(0, 4);
  const taskPreview = taskLines.map(line => {
    const done = /- \[x\]/i.test(line);
    const text = line.replace(/^- \[[ x]\]\s*/i, '');
    return `<div class="task-item">
      <span class="${done ? 'task-check' : 'task-pending'}">${done ? '&#10003;' : '&#9675;'}</span>
      <span>${escapeHtml(text)}</span>
    </div>`;
  }).join('');

  const tags = (s.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const sourceLabel = s.sourceName ? `<span class="source-tag">${escapeHtml(s.sourceName)}</span>` : '';
  const modeLabel = s.update_mode ? `<span class="update-mode-tag">${escapeHtml(s.update_mode)}</span>` : '';

  // Latest activity
  const latestActivity = s.activityLog && s.activityLog.length > 0
    ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.5rem;padding-left:0.5rem;">Latest: ${escapeHtml(s.activityLog[s.activityLog.length - 1].title)}</div>`
    : '';

  return `
    <div class="session-card" data-file="${escapeHtml(s.file)}" data-source="${escapeHtml(s.sourceFolder)}" data-status="${status}">
      <div class="status-stripe stripe-${status}"></div>
      <div class="card-header">
        <span class="card-title">${escapeHtml(s.title || s.file)}</span>
        <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      </div>
      <div class="card-meta">
        ${sourceLabel}
        ${modeLabel}
        ${s.branch ? `<span>&#127807; ${escapeHtml(s.branch)}</span>` : ''}
        ${s.updated_at ? `<span>Updated ${timeAgo(s.updated_at)}</span>` : ''}
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" style="width:${progress}%;background:${statusColor(status)}"></div>
      </div>
      <div class="progress-info">
        <span>${s.tasks.done}/${s.tasks.total} tasks</span>
        <span>${progress}%</span>
      </div>
      ${taskPreview ? `<div class="card-tasks">${taskPreview}</div>` : ''}
      ${latestActivity}
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    </div>
  `;
}

// --- Session detail modal ---
function openModal(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (progress / 100) * circumference;

  // Build activity timeline HTML
  let timelineHTML = '';
  if (s.activityLog && s.activityLog.length > 0) {
    timelineHTML = `
      <h2 style="color:var(--accent);margin-top:1.5rem;margin-bottom:0.75rem;">Activity Timeline</h2>
      <div class="activity-timeline">
        ${s.activityLog.map(entry => `
          <div class="activity-entry">
            <div class="activity-time">${escapeHtml(entry.timestamp)}</div>
            <div class="activity-title">${escapeHtml(entry.title)}</div>
            ${entry.body ? `<div class="activity-body">${escapeHtml(entry.body)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  modalBody.innerHTML = `
    <h2>${escapeHtml(s.title || s.file)}</h2>
    <div class="modal-meta">
      <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      ${s.session_id ? `<span>ID: ${escapeHtml(s.session_id)}</span>` : ''}
      ${s.branch ? `<span>&#127807; ${escapeHtml(s.branch)}</span>` : ''}
      ${s.repository ? `<span>&#128230; ${escapeHtml(s.repository)}</span>` : ''}
      ${s.agent_model ? `<span>&#129302; ${escapeHtml(s.agent_model)}</span>` : ''}
      ${s.update_mode ? `<span class="update-mode-tag">${escapeHtml(s.update_mode)} mode</span>` : ''}
      ${s.sourceName ? `<span class="source-tag">${escapeHtml(s.sourceName)}</span>` : ''}
      ${s.started_at ? `<span>Started: ${new Date(s.started_at).toLocaleString()}</span>` : ''}
      ${s.updated_at ? `<span>Updated: ${new Date(s.updated_at).toLocaleString()}</span>` : ''}
    </div>
    <div class="modal-progress">
      <div class="progress-ring">
        <svg width="64" height="64">
          <circle class="progress-ring-bg" cx="32" cy="32" r="28"/>
          <circle class="progress-ring-fill" cx="32" cy="32" r="28"
            style="stroke:${statusColor(status)};stroke-dasharray:${circumference};stroke-dashoffset:${offset}"/>
        </svg>
        <div class="progress-ring-text">${progress}%</div>
      </div>
      <div>
        <div style="font-weight:600">${s.tasks.done} of ${s.tasks.total} tasks complete</div>
        <div style="font-size:0.8rem;color:var(--text-muted)">${s.tasks.total - s.tasks.done} remaining</div>
      </div>
    </div>
    ${timelineHTML}
    <div class="session-content">${s.html}</div>
  `;
  modalOverlay.classList.add('open');
}

function closeModal(overlay) {
  overlay.classList.remove('open');
}

// --- Settings ---
settingsBtn.addEventListener('click', () => {
  renderSettings();
  settingsOverlay.classList.add('open');
});

settingsClose.addEventListener('click', () => closeModal(settingsOverlay));
settingsOverlay.addEventListener('click', (e) => {
  if (e.target === settingsOverlay) closeModal(settingsOverlay);
});

function renderSettings() {
  if (!currentConfig) return;

  const mode = currentConfig.mode || 'not configured';
  const folders = currentConfig.mode === 'shared'
    ? [currentConfig.sharedFolder]
    : (currentConfig.watchFolders || []);

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
          <li>
            <span>${escapeHtml(f)}</span>
            ${isIndividual ? `<button class="remove-btn" data-folder="${escapeHtml(f)}">&times;</button>` : ''}
          </li>
        `).join('')}
      </ul>
      ${isIndividual ? `
        <div class="settings-folder-add">
          <input type="text" class="wizard-input" id="settings-new-folder" placeholder="Add folder path...">
          <button class="wizard-add-btn" id="settings-add-folder-btn">Add</button>
        </div>
      ` : ''}
    </div>
    <div class="settings-section">
      <h3>Reset</h3>
      <button class="settings-reset-btn" id="settings-reset-btn">Reset Configuration</button>
      <p class="wizard-hint" style="margin-top:0.4rem">This will clear your config and show the setup wizard again.</p>
    </div>
  `;

  // Add folder (individual mode)
  if (isIndividual) {
    const addBtn = document.getElementById('settings-add-folder-btn');
    const input = document.getElementById('settings-new-folder');

    addBtn.addEventListener('click', async () => {
      const val = input.value.trim();
      if (!val) return;
      await fetch('/api/config/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: val }),
      });
      input.value = '';
      await refreshConfig();
      renderSettings();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addBtn.click();
    });

    // Remove folder buttons
    document.querySelectorAll('#settings-folder-list .remove-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await fetch('/api/config/folders', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: btn.dataset.folder }),
        });
        await refreshConfig();
        renderSettings();
      });
    });
  }

  // Reset
  document.getElementById('settings-reset-btn').addEventListener('click', async () => {
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: null }),
    });
    location.reload();
  });
}

async function refreshConfig() {
  const res = await fetch('/api/config');
  currentConfig = await res.json();
}

// --- Utilities ---
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Event listeners ---
modalClose.addEventListener('click', () => closeModal(modalOverlay));
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal(modalOverlay);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal(modalOverlay);
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

// SSE live reload
const evtSource = new EventSource('/api/events');
evtSource.onmessage = () => fetchSessions();

// --- Boot ---
init();
