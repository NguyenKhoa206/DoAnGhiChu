const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config/jwt');

const passwordVersion = (passwordHash) => crypto.createHmac('sha256', JWT_SECRET)
  .update(passwordHash).digest('hex');

// A private grant is separate from the persistent account session. Changing the
// password hash invalidates every previously issued private grant.
const createPrivateAccessToken = (userId, passwordHash) => jwt.sign({
  userId,
  scope: 'private-notes',
  version: passwordVersion(passwordHash),
}, JWT_SECRET, {
  algorithm: 'HS256',
  audience: 'private-notes',
  issuer: 'noteapp',
  expiresIn: '1h',
});

const verifyPrivateAccessToken = (token, userId, passwordHash) => {
  const payload = jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'],
    audience: 'private-notes',
    issuer: 'noteapp',
  });
  if (payload.scope !== 'private-notes' || payload.userId !== userId
    || payload.version !== passwordVersion(passwordHash)) {
    throw new jwt.JsonWebTokenError('Invalid private access grant');
  }
  return payload;
};

module.exports = { createPrivateAccessToken, verifyPrivateAccessToken };
