const path = require('node:path');
const bcrypt = require('bcryptjs');
const { DATA_DIR } = require('./notebookStorage');
const { readJsonFile, writeJsonFile } = require('./read_write');

const MAX_FAILED_ATTEMPTS = 6; // "Quá 5 lần": the sixth wrong password starts the lock.
const LOCK_DURATION_MS = 10 * 60 * 1000;
const attemptsPath = path.join(DATA_DIR, 'private-attempts.json');
let queue = Promise.resolve();

const serializedPasswordHandler = (handler) => (req, res, next) => {
  const operation = queue.then(() => handler(req, res));
  queue = operation.catch(() => {});
  return operation.catch(next);
};

const getPrivateAttemptStatus = async () => {
  const saved = await readJsonFile(attemptsPath);
  const state = {
    failedAttempts: Number.isInteger(saved?.failedAttempts) ? Math.max(0, saved.failedAttempts) : 0,
    lockedUntil: Number.isFinite(saved?.lockedUntil) ? saved.lockedUntil : 0,
  };
  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    state.failedAttempts = 0;
    state.lockedUntil = 0;
  }
  return { ...state, retryAfterSeconds: Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000)) };
};

const rejectPrivateLock = async (res) => {
  const state = await getPrivateAttemptStatus();
  if (!state.retryAfterSeconds) return false;
  res.set('Retry-After', String(state.retryAfterSeconds));
  res.status(429).json({ success: false, code: 'PRIVATE_RATE_LIMITED', lockedUntil: state.lockedUntil,
    retryAfterSeconds: state.retryAfterSeconds, message: 'Vùng riêng tư tạm khóa 10 phút do nhập sai mật khẩu quá 5 lần.' });
  return true;
};

const checkPrivatePassword = async (password, hash, res) => {
  if (await rejectPrivateLock(res)) return false;
  if (await bcrypt.compare(password, hash)) {
    await writeJsonFile(attemptsPath, { failedAttempts: 0, lockedUntil: 0 });
    return true;
  }
  const state = await getPrivateAttemptStatus();
  const failedAttempts = state.failedAttempts + 1;
  await writeJsonFile(attemptsPath, { failedAttempts, lockedUntil: failedAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCK_DURATION_MS : 0 });
  if (await rejectPrivateLock(res)) return false;
  const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedAttempts;
  res.status(401).json({ success: false, code: 'PRIVATE_PASSWORD_INVALID', attemptsRemaining,
    message: `Sai mật khẩu riêng tư. Còn ${attemptsRemaining} lần thử trước khi tạm khóa 10 phút.` });
  return false;
};

module.exports = { MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS, attemptsPath, serializedPasswordHandler, getPrivateAttemptStatus, rejectPrivateLock, checkPrivatePassword };
