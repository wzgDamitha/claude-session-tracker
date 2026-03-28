const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { marked } = require('marked');
const chokidar = require('chokidar');

const app = express();
const PORT = process.env.PORT || 3890;
const SESSIONS_DIR = path.resolve(process.env.SESSIONS_DIR || path.join(__dirname, '..', '.claude', 'sessions'));

// Track connected SSE clients for live reload
const clients = new Set();

// Watch session files for changes
const watcher = chokidar.watch(SESSIONS_DIR, {
  ignoreInitial: true,
  ignored: /(^|[\/\\])\../,
});

watcher.on('all', () => {
  for (const client of clients) {
    client.write(`data: reload\n\n`);
  }
});

app.use(express.static(path.join(__dirname, '..', 'public')));

// SSE endpoint for live reload
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// Parse a single session markdown file
function parseSessionFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  // Count tasks
  const tasksDone = (content.match(/- \[x\]/gi) || []).length;
  const tasksTodo = (content.match(/- \[ \]/g) || []).length;
  const tasksTotal = tasksDone + tasksTodo;

  // Extract sections
  const sections = {};
  const sectionRegex = /^## (.+)$/gm;
  let match;
  const sectionPositions = [];
  while ((match = sectionRegex.exec(content)) !== null) {
    sectionPositions.push({ name: match[1], start: match.index + match[0].length });
  }
  for (let i = 0; i < sectionPositions.length; i++) {
    const end = i + 1 < sectionPositions.length ? sectionPositions[i + 1].start - sectionPositions[i + 1].name.length - 3 : content.length;
    const sectionContent = content.slice(sectionPositions[i].start, end).trim();
    sections[sectionPositions[i].name] = sectionContent;
  }

  return {
    file: path.basename(filePath),
    ...frontmatter,
    progress: frontmatter.progress ?? (tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0),
    tasks: { done: tasksDone, total: tasksTotal },
    sections,
    html: marked(content),
  };
}

// GET all sessions
app.get('/api/sessions', (req, res) => {
  if (!fs.existsSync(SESSIONS_DIR)) {
    return res.json([]);
  }

  const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.md'));
  const sessions = files.map(f => {
    try {
      return parseSessionFile(path.join(SESSIONS_DIR, f));
    } catch (err) {
      console.error(`Error parsing ${f}:`, err.message);
      return null;
    }
  }).filter(Boolean);

  // Sort by updated_at descending
  sessions.sort((a, b) => {
    const da = a.updated_at ? new Date(a.updated_at) : new Date(0);
    const db = b.updated_at ? new Date(b.updated_at) : new Date(0);
    return db - da;
  });

  res.json(sessions);
});

// GET single session
app.get('/api/sessions/:file', (req, res) => {
  const filePath = path.join(SESSIONS_DIR, req.params.file);
  if (!filePath.startsWith(SESSIONS_DIR) || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Session not found' });
  }
  try {
    res.json(parseSessionFile(filePath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n  🔍 Claude Session Tracker`);
  console.log(`  ➜ http://localhost:${PORT}`);
  console.log(`  📁 Watching: ${SESSIONS_DIR}\n`);
});
