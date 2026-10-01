const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const USERS_DATA_DIR = path.join(DATA_DIR, 'users');

const getAccountDir = (userId) => path.join(USERS_DATA_DIR, userId);

const getAccountProfilePath = (userId) => path.join(getAccountDir(userId), 'profile.json');

module.exports = { DATA_DIR, USERS_DATA_DIR, getAccountDir, getAccountProfilePath };
