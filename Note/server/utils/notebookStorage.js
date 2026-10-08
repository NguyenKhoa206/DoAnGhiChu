const path = require('node:path');
const fs = require('fs-extra');
const { readJsonFile, writeJsonFile } = require('./read_write');

const DATA_DIR = path.resolve(process.env.NOTEAPP_DATA_DIR || path.join(__dirname, '../data'));
const NOTEBOOK_ID = 'local-notebook';
const getNotebookDir = () => DATA_DIR;
const getProfilePath = () => path.join(DATA_DIR, 'profile.json');
const DEFAULT_PREFERENCES = { theme: 'light', primaryColor: '#2463eb', noteLayout: 'table', noteSort: 'newest', density: 'comfortable' };
let preparing = Promise.resolve();

// Import a single legacy notebook once; keep its source files as a backup.
const migrateLegacyNotebook = async () => {
  const marker = path.join(DATA_DIR, '.notebook-migrated');
  if (await fs.pathExists(marker)) return;
  if (!await fs.pathExists(getProfilePath())) {
    const usersDir = path.join(DATA_DIR, 'users');
    const folders = await fs.pathExists(usersDir) ? (await fs.readdir(usersDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name) : [];
    const selected = process.env.NOTEAPP_LEGACY_USER_ID || (folders.length === 1 ? folders[0] : null);
    if (selected && folders.includes(selected)) {
      const source = path.join(usersDir, selected);
      for (const name of ['profile.json', 'notes', 'private.json', 'trash.json', 'private-trash.json']) {
        const original = path.join(source, name);
        const target = path.join(DATA_DIR, name);
        if (await fs.pathExists(original) && !await fs.pathExists(target)) await fs.copy(original, target);
      }
    }
  }
  await fs.outputFile(marker, 'Local notebook initialized. Legacy source files are retained.\n');
};

const prepareNotebook = () => {
  const operation = preparing.then(async () => {
    await fs.ensureDir(DATA_DIR);
    await migrateLegacyNotebook();
    const previous = await readJsonFile(getProfilePath());
    const valid = previous && typeof previous === 'object' && !Array.isArray(previous) ? previous : {};
    const now = new Date().toISOString();
    const profile = {
      ...valid, id: NOTEBOOK_ID, displayName: valid.displayName || 'Sổ tay cá nhân', email: valid.email || '',
      preferences: { ...DEFAULT_PREFERENCES, ...valid.preferences },
      privatePasswordHash: valid.privatePasswordHash || null,
      createdAt: valid.createdAt || now, updatedAt: valid.updatedAt || now,
    };
    delete profile.passwordHash;
    delete profile.username;
    delete profile.role;
    if (JSON.stringify(previous) !== JSON.stringify(profile)) await writeJsonFile(getProfilePath(), profile);
    await fs.ensureDir(path.join(DATA_DIR, 'notes'));
    return profile;
  });
  preparing = operation.catch(() => {});
  return operation;
};

module.exports = { DATA_DIR, NOTEBOOK_ID, getNotebookDir, getProfilePath, prepareNotebook };
