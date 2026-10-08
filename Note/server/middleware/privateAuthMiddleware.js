const { readJsonFile } = require('../utils/read_write');
const { getProfilePath } = require('../utils/notebookStorage');
const { verifyPrivateAccessToken } = require('../utils/privateAccess');

const { rejectPrivateLock } = require('../utils/privateAttempts');

const privateAuthMiddleware = async (req, res, next) => {
  if (await rejectPrivateLock(res)) return;
  const locked = () => res.status(403).json({
    success: false,
    code: 'PRIVATE_LOCKED',
    message: 'Vùng ghi chú riêng tư đang khóa. Vui lòng nhập lại mật khẩu riêng tư.',
  });
  const token = req.headers['x-private-token'];
  if (typeof token !== 'string' || !token || !req.user?.userId) return locked();

  try {
    const profile = await readJsonFile(getProfilePath(req.user.userId));
    if (!profile?.privatePasswordHash) return locked();
    verifyPrivateAccessToken(token, req.user.userId, profile.privatePasswordHash);
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
      || error.name === 'NotBeforeError') return locked();
    console.error('Lỗi kiểm tra phiên riêng tư:', error.message);
    return res.status(500).json({ message: 'Không thể kiểm tra quyền truy cập vùng riêng tư.' });
  }
};

module.exports = privateAuthMiddleware;
