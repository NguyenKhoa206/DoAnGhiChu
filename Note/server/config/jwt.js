const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

if (process.env.NODE_ENV === 'production'
  && (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32)) {
  throw new Error('JWT_SECRET must be set to at least 32 bytes in production.');
}

const getPersistentDevelopmentSecret = () => {
  const secretPath = process.env.JWT_SECRET_FILE || path.resolve(__dirname, '../data/.jwt-secret');
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  try {
    const stored = fs.readFileSync(secretPath, 'utf8').trim();
    if (Buffer.byteLength(stored) >= 32) return stored;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const generated = crypto.randomBytes(64).toString('hex');
  try {
    fs.writeFileSync(secretPath, `${generated}\n`, { flag: 'wx', mode: 0o600 });
    return generated;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    return fs.readFileSync(secretPath, 'utf8').trim();
  }
};

// Development generates one secret on first start and keeps it outside source control.
const JWT_SECRET = process.env.JWT_SECRET || getPersistentDevelopmentSecret();

module.exports = JWT_SECRET;
