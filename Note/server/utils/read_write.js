const fs = require('fs-extra');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

// Missing and blank JSON files are treated as new data. Invalid nonempty JSON
// remains an error, rather than silently deleting a user's saved information.
const readJsonFile = async (filePath) => {
  try {
    const text = await fs.readFile(filePath, 'utf8');
    return text.trim() ? JSON.parse(text) : null;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
};

// Write to a temporary sibling and rename, so readers never see half a JSON file.
const writeJsonFile = async (filePath, data) => {
  await fs.ensureDir(path.dirname(filePath));
  const temporary = `${filePath}.${randomUUID()}.tmp`;
  try {
    await fs.writeJson(temporary, data, { spaces: 2 });
    await fs.rename(temporary, filePath);
    return true;
  } finally { await fs.remove(temporary); }
};

module.exports = { readJsonFile, writeJsonFile };
