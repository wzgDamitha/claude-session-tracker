const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'tracker-config.json');

const DEFAULT_CONFIG = {
  mode: null,
  sharedFolder: '',
  watchFolders: [],
  discoverRoots: [],
  maxWidth: '100%',
  rowGap: '0px',
  columnGap: '0px',
  fontScale: '100',
  detailMaxWidth: '900px',
  port: 3890,
};

function configExists() {
  return fs.existsSync(CONFIG_PATH);
}

function loadConfig() {
  if (!configExists()) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    // Migrate legacy discoverRoot string to discoverRoots array
    if (parsed.discoverRoot && (!parsed.discoverRoots || parsed.discoverRoots.length === 0)) {
      parsed.discoverRoots = [parsed.discoverRoot];
    }
    delete parsed.discoverRoot;
    return parsed;
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function saveConfig(data) {
  const config = { ...DEFAULT_CONFIG, ...data };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  return config;
}

function isConfigured() {
  const config = loadConfig();
  return config.mode !== null;
}

function getWatchPaths() {
  const config = loadConfig();
  if (config.mode === 'shared') {
    return config.sharedFolder ? [config.sharedFolder] : [];
  }
  if (config.mode === 'individual') {
    return config.watchFolders || [];
  }
  // Fallback: check for legacy .claude/sessions folder
  const legacy = path.join(__dirname, '..', '.claude', 'sessions');
  if (fs.existsSync(legacy)) {
    return [legacy];
  }
  return [];
}

function validateFolderPath(folderPath) {
  const resolved = path.resolve(folderPath);
  const exists = fs.existsSync(resolved);
  return { resolved, exists };
}

module.exports = {
  CONFIG_PATH,
  configExists,
  loadConfig,
  saveConfig,
  isConfigured,
  getWatchPaths,
  validateFolderPath,
};
