let sessions = [];
let activeFilter = 'all';

const grid = document.getElementById('sessions-grid');
const emptyState = document.getElementById('empty-state');
const headerStats = document.getElementById('header-stats');
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const filtersContainer = document.getElementById('filters');

// Fetch sessions from API
async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    sessions = await res.json();
    render();
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  }
}

// Render dashboard
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

  // Attach click listeners
  grid.querySelectorAll('.session-card').forEach(card => {
    card.addEventListener('click', () => {
      const file = card.dataset.file;
      const session = sessions.find(s => s.file === file);
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

  // Extract first few tasks for preview
  const tasksSection = s.sections?.['Tasks'] || '';
  const taskLines = tasksSection.split('\n').filter(l => l.match(/^- \[[ x]\]/i)).slice(0, 4);
  const taskPreview = taskLines.map(line => {
    const done = /- \[x\]/i.test(line);
    const text = line.replace(/^- \[[ x]\]\s*/i, '');
    return `<div class="task-item">
      <span class="${done ? 'task-check' : 'task-pending'}">${done ? '✓' : '○'}</span>
      <span>${escapeHtml(text)}</span>
    </div>`;
  }).join('');

  const tags = (s.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

  return `
    <div class="session-card" data-file="${escapeHtml(s.file)}" data-status="${status}">
      <div class="status-stripe stripe-${status}"></div>
      <div class="card-header">
        <span class="card-title">${escapeHtml(s.title || s.file)}</span>
        <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      </div>
      <div class="card-meta">
        ${s.branch ? `<span>🌿 ${escapeHtml(s.branch)}</span>` : ''}
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
      ${tags ? `<div class="card-tags">${tags}</div>` : ''}
    </div>
  `;
}

function openModal(s) {
  const status = s.status || 'not_started';
  const progress = s.progress || 0;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (progress / 100) * circumference;

  modalBody.innerHTML = `
    <h2>${escapeHtml(s.title || s.file)}</h2>
    <div class="modal-meta">
      <span class="status-badge status-${status}">${status.replace('_', ' ')}</span>
      ${s.session_id ? `<span>ID: ${escapeHtml(s.session_id)}</span>` : ''}
      ${s.branch ? `<span>🌿 ${escapeHtml(s.branch)}</span>` : ''}
      ${s.repository ? `<span>📦 ${escapeHtml(s.repository)}</span>` : ''}
      ${s.agent_model ? `<span>🤖 ${escapeHtml(s.agent_model)}</span>` : ''}
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
    <div class="session-content">${s.html}</div>
  `;
  modalOverlay.classList.add('open');
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Event listeners
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
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

// Initial load
fetchSessions();
