const path = require('node:path');
const fs = require('fs-extra');
const { readJsonFile, writeJsonFile } = require('./read_write');
const { withNotebookMutation } = require('./notebookMutation');

const DATA_DIR = path.resolve(process.env.NOTEAPP_DATA_DIR || path.join(__dirname, '../data'));
const NOTEBOOK_ID = 'local-notebook';
const UNFILED_FILE = '_unfiled.json';
const getNotebookDir = () => DATA_DIR;
const getProfilePath = () => path.join(DATA_DIR, 'profile.json');
const DEFAULT_PREFERENCES = { theme: 'light', primaryColor: '#2463eb', noteLayout: 'table', noteSort: 'newest', density: 'comfortable' };

// Remove former automatic collections, retaining explicitly named journals.
const migrateDefaultTopics = async () => {
  const notesDir = path.join(DATA_DIR, 'notes');
  const target = path.join(notesDir, UNFILED_FILE);
  const savedNames = await readJsonFile(path.join(DATA_DIR, 'topics.json'));
  if (savedNames !== null && (typeof savedNames !== 'object' || Array.isArray(savedNames))) {
    throw new Error('Tên bộ sưu tập phải là một đối tượng JSON.');
  }
  const names = savedNames || {};
  for (const slug of ['ghi-chu', 'nhat-ky']) {
    // A name persisted by create/rename/restore marks a user collection.
    // Keep it across requests and restarts instead of migrating it away.
    if (slug === 'nhat-ky' && typeof names[slug] === 'string' && names[slug].trim()) continue;
    const source = path.join(notesDir, `${slug}.json`);
    if (!await fs.pathExists(source)) continue;
    const previous = await readJsonFile(source) || [];
    const unfiled = await readJsonFile(target) || [];
    if (!Array.isArray(previous) || !Array.isArray(unfiled)) throw new Error('Dữ liệu ghi chú phải là một mảng JSON.');
    // If interrupted after writing, running this migration again is safe.
    const ids = new Set(unfiled.map((note) => note.id));
    await writeJsonFile(target, [...unfiled, ...previous.filter((note) => !ids.has(note.id))]);
    await fs.remove(source);
  }
};

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

// Preparation can migrate collection files. Use the mutation queue so a reload
// cannot treat a file whose display name is still being saved as legacy data.
const prepareNotebook = () => withNotebookMutation(async () => {
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
  await migrateDefaultTopics();
  return profile;
});

module.exports = { DATA_DIR, NOTEBOOK_ID, UNFILED_FILE, getNotebookDir, getProfilePath, prepareNotebook };
