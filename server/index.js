const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { marked } = require('marked');
const chokidar = require('chokidar');
const config = require('./config');

const app = express();
app.use(express.json());

const PORT = (() => {
  const cfg = config.loadConfig();
  return process.env.PORT || cfg.port || 3890;
})();

// --- SSE clients for live reload ---
const clients = new Set();

function notifyClients() {
  for (const client of clients) {
    client.write(`data: reload\n\n`);
  }
}

// --- File watcher management ---
let watcher = null;

function buildWatcher() {
  if (watcher) {
    watcher.close();
  }

  const paths = config.getWatchPaths();
  if (paths.length === 0) {
    watcher = null;
    return;
  }

  // Ensure all directories exist
  for (const p of paths) {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  }

  watcher = chokidar.watch(paths, {
    ignoreInitial: true,
    ignored: /(^|[\/\\])\../,
    depth: 1,
  });

  watcher.on('all', () => notifyClients());
}

buildWatcher();

// --- Static files ---
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- SSE endpoint ---
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// --- Config API ---
app.get('/api/config', (req, res) => {
  const cfg = config.loadConfig();
  res.json({
    configured: config.isConfigured(),
    ...cfg,
  });
});

app.post('/api/config', (req, res) => {
  const { mode, sharedFolder, watchFolders, discoverRoots, discoverRoot, port, maxWidth, rowGap, columnGap, fontScale, detailMaxWidth } = req.body;

  // Allow reset (mode: null)
  if (mode === null) {
    const saved = config.saveConfig({ mode: null, sharedFolder: '', watchFolders: [], discoverRoot: '', port: port || 3890 });
    buildWatcher();
    return res.json({ success: true, config: saved });
  }

  if (!mode || !['shared', 'individual'].includes(mode)) {
    return res.status(400).json({ error: 'mode must be "shared" or "individual"' });
  }

  if (mode === 'shared' && !sharedFolder) {
    return res.status(400).json({ error: 'sharedFolder is required for shared mode' });
  }

  if (mode === 'individual' && (!watchFolders || watchFolders.length === 0)) {
    return res.status(400).json({ error: 'At least one folder is required for individual mode' });
  }

  // Validate and resolve paths
  const warnings = [];

  if (mode === 'shared') {
    const { resolved, exists } = config.validateFolderPath(sharedFolder);
    if (!exists) {
      try {
        fs.mkdirSync(resolved, { recursive: true });
      } catch {
        warnings.push(`Could not create folder: ${resolved}`);
      }
    }
  }

  if (mode === 'individual') {
    for (const folder of watchFolders) {
      const { resolved, exists } = config.validateFolderPath(folder);
      if (!exists) {
        try {
          fs.mkdirSync(resolved, { recursive: true });
        } catch {
          warnings.push(`Could not create folder: ${resolved}`);
        }
      }
    }
  }

  const saved = config.saveConfig({
    mode,
    sharedFolder: mode === 'shared' ? sharedFolder : '',
    watchFolders: mode === 'individual' ? watchFolders : [],
    discoverRoots: discoverRoots || (discoverRoot ? [discoverRoot] : []),
    port: port || 3890,
    maxWidth: maxWidth || '100%',
    rowGap: rowGap || '0px',
    columnGap: columnGap || '0px',
    fontScale: fontScale || '100',
    detailMaxWidth: detailMaxWidth || '900px',
  });

  buildWatcher();
  notifyClients();

  res.json({ success: true, config: saved, warnings });
});

app.post('/api/config/folders', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) {
    return res.status(400).json({ error: 'path is required' });
  }

  const cfg = config.loadConfig();
  if (cfg.mode !== 'individual') {
    return res.status(400).json({ error: 'Can only add folders in individual mode' });
  }

  const { resolved, exists } = config.validateFolderPath(folderPath);
  if (!exists) {
    try {
      fs.mkdirSync(resolved, { recursive: true });
    } catch {
      // folder might be created later
    }
  }

  if (!cfg.watchFolders.includes(resolved)) {
    cfg.watchFolders.push(resolved);
    config.saveConfig(cfg);
    buildWatcher();
    notifyClients();
  }

  res.json({ success: true, watchFolders: cfg.watchFolders });
});

app.delete('/api/config/folders', (req, res) => {
  const { path: folderPath } = req.body;
  if (!folderPath) {
    return res.status(400).json({ error: 'path is required' });
  }

  const cfg = config.loadConfig();
  if (cfg.mode !== 'individual') {
    return res.status(400).json({ error: 'Can only remove folders in individual mode' });
  }

  const resolved = path.resolve(folderPath);
  cfg.watchFolders = cfg.watchFolders.filter(f => path.resolve(f) !== resolved);
  config.saveConfig(cfg);
  buildWatcher();
  notifyClients();

  res.json({ success: true, watchFolders: cfg.watchFolders });
});

// --- Project discovery ---
function discoverProjects(dir, rootDir, maxDepth, depth) {
  if (depth > maxDepth) return [];
  const projects = [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return projects;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') continue;

    const fullPath = path.join(dir, entry.name);

    // Check if this directory has .claude/sessions
    const sessionsDir = path.join(fullPath, '.claude', 'sessions');
    const hasSessionsDir = fs.existsSync(sessionsDir);
    const hasClaude = fs.existsSync(path.join(fullPath, 'CLAUDE.md'))
      || fs.existsSync(path.join(fullPath, 'claude.md'));

    if (hasClaude || hasSessionsDir) {
      let sessionCount = 0;
      if (hasSessionsDir) {
        try {
          sessionCount = fs.readdirSync(sessionsDir)
            .filter(f => isSessionFile(f)).length;
        } catch {}
      }

      // Use relative path from root for the name
      const relativePath = path.relative(rootDir, fullPath);
      projects.push({
        name: relativePath.includes(path.sep) ? relativePath : entry.name,
        path: fullPath,
        sessionsPath: sessionsDir,
        hasClaude,
        hasSessionsDir,
        sessionCount,
      });
    }

    // Recurse into subdirectories to find nested projects
    if (depth < maxDepth) {
      projects.push(...discoverProjects(fullPath, rootDir, maxDepth, depth + 1));
    }
  }

  return projects;
}

app.get('/api/discover', (req, res) => {
  const root = req.query.root;
  if (!root) {
    return res.status(400).json({ error: 'root query parameter is required' });
  }

  const resolved = path.resolve(root);
  if (!fs.existsSync(resolved)) {
    return res.status(400).json({ error: `Folder not found: ${resolved}` });
  }

  const maxDepth = parseInt(req.query.depth, 10) || 3;
  const projects = discoverProjects(resolved, resolved, maxDepth, 0);

  // Sort: projects with CLAUDE.md first, then by name
  projects.sort((a, b) => {
    if (a.hasClaude !== b.hasClaude) return a.hasClaude ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  res.json({ root: resolved, projects });
});

// --- Session file naming ---
// Only files matching session-* or session_* are treated as session reports
function isSessionFile(filename) {
  return /^session[-_].+\.md$/i.test(filename);
}

// --- Session parsing ---
function parseActivityLog(content) {
  const logSection = content.match(/## Activity Log\n([\s\S]*?)(?=\n## |\n*$)/);
  if (!logSection) return [];

  const entries = [];
  const entryRegex = /### \[([^\]]+)\]\s*(.+)\n([\s\S]*?)(?=\n### \[|$)/g;
  let match;
  while ((match = entryRegex.exec(logSection[1])) !== null) {
    const title = match[2].trim();
    // Detect session boundary entries
    const isSessionStart = /^(Session started|Tracking started)/i.test(title);
    const isSessionEnd = /^(Session (completed|paused|ended))/i.test(title);
    // Extract session ID from boundary entries like "Session started — session_abc123 (branch)"
    const sessionMatch = title.match(/— (session[-_]\S+)/);
    entries.push({
      timestamp: match[1].trim(),
      title,
      body: match[3].trim(),
      type: isSessionStart ? 'session_start' : isSessionEnd ? 'session_end' : 'work',
      sessionRef: sessionMatch ? sessionMatch[1] : null,
    });
  }
  return entries;
}

// Extract list of unique sessions that contributed to this project
function extractSessionHistory(activityLog) {
  const sessions = [];
  const seen = new Set();
  for (const entry of activityLog) {
    if (entry.sessionRef && !seen.has(entry.sessionRef)) {
      seen.add(entry.sessionRef);
      sessions.push({
        sessionId: entry.sessionRef,
        firstSeen: entry.timestamp,
        type: entry.type,
      });
    }
  }
  return sessions;
}

function parseSessionFile(filePath, sourceFolder) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  // Count tasks
  const tasksDone = (content.match(/- \[x\]/gi) || []).length;
  const tasksTodo = (content.match(/- \[ \]/g) || []).length;
  const tasksTotal = tasksDone + tasksTodo;

  // Extract sections
  const sections = {};
  const sectionRegex = /^## (.+)$/gm;
  let m;
  const sectionPositions = [];
  while ((m = sectionRegex.exec(content)) !== null) {
    sectionPositions.push({ name: m[1], start: m.index + m[0].length });
  }
  for (let i = 0; i < sectionPositions.length; i++) {
    const end = i + 1 < sectionPositions.length
      ? sectionPositions[i + 1].start - sectionPositions[i + 1].name.length - 3
      : content.length;
    sections[sectionPositions[i].name] = content.slice(sectionPositions[i].start, end).trim();
  }

  // Parse activity log
  const activityLog = parseActivityLog(content);
  const sessionHistory = extractSessionHistory(activityLog);

  // Source folder label
  const sourceName = sourceFolder ? path.basename(path.resolve(sourceFolder, '..', '..')) || path.basename(sourceFolder) : '';

  return {
    file: path.basename(filePath),
    sourceFolder: sourceFolder || '',
    sourceName,
    ...frontmatter,
    progress: frontmatter.progress ?? (tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0),
    tasks: { done: tasksDone, total: tasksTotal },
    sections,
    activityLog,
    sessionHistory,
    sessionCount: sessionHistory.length,
    html: marked(content),
  };
}

// --- Session API ---
app.get('/api/sessions', (req, res) => {
  const watchPaths = config.getWatchPaths();

  if (watchPaths.length === 0) {
    return res.json([]);
  }

  const sessions = [];

  for (const dir of watchPaths) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => isSessionFile(f));
    for (const f of files) {
      try {
        sessions.push(parseSessionFile(path.join(dir, f), dir));
      } catch (err) {
        console.error(`Error parsing ${f} in ${dir}:`, err.message);
      }
    }
  }

  // Sort by updated_at descending
  sessions.sort((a, b) => {
    const da = a.updated_at ? new Date(a.updated_at) : new Date(0);
    const db = b.updated_at ? new Date(b.updated_at) : new Date(0);
    return db - da;
  });

  res.json(sessions);
});

app.get('/api/sessions/:file', (req, res) => {
  const sourceFolder = req.query.source;
  const watchPaths = config.getWatchPaths();

  // Search in specific folder or all folders
  const searchPaths = sourceFolder ? [sourceFolder] : watchPaths;

  for (const dir of searchPaths) {
    const resolved = path.resolve(dir);
    const filePath = path.join(resolved, req.params.file);

    // Path traversal protection
    if (!filePath.startsWith(resolved)) continue;
    if (!fs.existsSync(filePath)) continue;

    try {
      return res.json(parseSessionFile(filePath, dir));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(404).json({ error: 'Session not found' });
});

// --- Update session frontmatter (priority, etc.) ---
app.patch('/api/sessions/:file', (req, res) => {
  const sourceFolder = req.query.source;
  const watchPaths = config.getWatchPaths();
  const searchPaths = sourceFolder ? [sourceFolder] : watchPaths;
  const validPriorities = ['critical', 'high', 'medium', 'low', 'none'];

  for (const dir of searchPaths) {
    const resolved = path.resolve(dir);
    const filePath = path.join(resolved, req.params.file);
    if (!filePath.startsWith(resolved)) continue;
    if (!fs.existsSync(filePath)) continue;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);

      if (req.body.priority !== undefined) {
        if (!validPriorities.includes(req.body.priority)) {
          return res.status(400).json({ error: 'Invalid priority' });
        }
        data.priority = req.body.priority;
      }

      const updated = matter.stringify(content, data);
      fs.writeFileSync(filePath, updated, 'utf-8');
      notifyClients();
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(404).json({ error: 'Session not found' });
});

// --- Tech Stack API ---
app.get('/api/tech-stack', (req, res) => {
  const sourceFolder = req.query.source;
  if (!isValidSourceFolder(sourceFolder)) {
    return res.status(400).json({ error: 'Invalid source folder' });
  }

  const techPath = path.join(path.resolve(sourceFolder), 'tech-stack.md');
  if (!fs.existsSync(techPath)) {
    return res.json({ exists: false, content: '', sections: {} });
  }

  try {
    const raw = fs.readFileSync(techPath, 'utf-8');
    // Parse sections
    const sections = {};
    const sectionRegex = /^## (.+)$/gm;
    let m;
    const positions = [];
    while ((m = sectionRegex.exec(raw)) !== null) {
      positions.push({ name: m[1], start: m.index + m[0].length });
    }
    for (let i = 0; i < positions.length; i++) {
      const end = i + 1 < positions.length
        ? positions[i + 1].start - positions[i + 1].name.length - 3
        : raw.length;
      sections[positions[i].name] = raw.slice(positions[i].start, end).trim();
    }
    res.json({ exists: true, content: raw, sections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Notes API ---
function isValidSourceFolder(sourceFolder) {
  if (!sourceFolder) return false;
  const resolved = path.resolve(sourceFolder);
  return config.getWatchPaths().some(p => resolved === path.resolve(p) || resolved.startsWith(path.resolve(p)));
}

function parseNotes(content) {
  const entries = [];
  const entryRegex = /### \[([^\]]+)\]\s*(.*)\n([\s\S]*?)(?=\n### \[|$)/g;
  let match;
  while ((match = entryRegex.exec(content)) !== null) {
    entries.push({
      timestamp: match[1].trim(),
      author: match[2].trim() || 'User',
      body: match[3].trim(),
    });
  }
  return entries;
}

function readNotesFile(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    return parseNotes(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

app.get('/api/notes', (req, res) => {
  const sourceFolder = req.query.source;
  if (!isValidSourceFolder(sourceFolder)) {
    return res.status(400).json({ error: 'Invalid source folder' });
  }

  const resolved = path.resolve(sourceFolder);
  const userEntries = readNotesFile(path.join(resolved, 'notes.md')).map(e => ({ ...e, source: 'user' }));
  const agentEntries = readNotesFile(path.join(resolved, 'agent-notes.md')).map(e => ({ ...e, source: 'agent' }));

  // Merge and sort by timestamp
  const entries = [...userEntries, ...agentEntries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  res.json({ entries });
});

app.post('/api/notes', (req, res) => {
  const sourceFolder = req.query.source;
  const { text } = req.body;

  if (!isValidSourceFolder(sourceFolder)) {
    return res.status(400).json({ error: 'Invalid source folder' });
  }
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const resolved = path.resolve(sourceFolder);
  const notesPath = path.join(resolved, 'notes.md');

  // Ensure directory exists
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  const entry = `### [${timestamp}] User\n${text.trim()}\n\n`;

  // Create with header or append
  if (!fs.existsSync(notesPath)) {
    fs.writeFileSync(notesPath, `# User Notes\n\n${entry}`, 'utf-8');
  } else {
    fs.appendFileSync(notesPath, entry, 'utf-8');
  }

  // Return merged timeline
  const userEntries = readNotesFile(notesPath).map(e => ({ ...e, source: 'user' }));
  const agentEntries = readNotesFile(path.join(resolved, 'agent-notes.md')).map(e => ({ ...e, source: 'agent' }));
  const entries = [...userEntries, ...agentEntries].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  res.json({ success: true, entries });
});

app.listen(PORT, () => {
  const configured = config.isConfigured();
  console.log(`\n  Claude Session Tracker`);
  console.log(`  http://localhost:${PORT}`);
  if (configured) {
    const paths = config.getWatchPaths();
    console.log(`  Watching ${paths.length} folder(s):`);
    paths.forEach(p => console.log(`    ${p}`));
  } else {
    console.log(`  First run — open the app to configure`);
  }
  console.log('');
});
