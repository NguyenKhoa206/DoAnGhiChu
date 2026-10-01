const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const { readJsonFile } = require('../utils/read_write');

const { getAccountProfilePath } = require('../utils/accountStorage');
const JWT_SECRET = require('../config/jwt');

/**
 * Middleware xác thực JSON Web Token (JWT)
 * Kiểm tra tính hợp lệ của token và trạng thái tài khoản người dùng
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ Header request
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Quyền truy cập bị từ chối. Token xác thực không tồn tại.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token xác thực không hợp lệ.',
      });
    }

    // 2. Giải mã và kiểm tra token
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    if (!decoded || typeof decoded.userId !== 'string' || !decoded.userId.trim()
      || (decoded.scope !== undefined && decoded.scope !== 'account')) {
      return res.status(401).json({
        code: 'INVALID_TOKEN',
        message: 'Token xác thực không hợp lệ.',
      });
    }

    // 3. Kiểm tra xem tài khoản người dùng có tồn tại hoặc bị khóa không
    const userProfilePath = getAccountProfilePath(decoded.userId);

    if (!await fs.pathExists(userProfilePath)) {
      return res.status(401).json({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Không tìm thấy tài khoản. Vui lòng đăng nhập lại.',
      });
    }

    const profile = await readJsonFile(userProfilePath);
    if (!profile || typeof profile !== 'object') {
      return res.status(401).json({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Không tìm thấy tài khoản. Vui lòng đăng nhập lại.',
      });
    }

    // Mọi phiên hợp lệ đều là tài khoản ghi chú thông thường.
    req.user = {
      userId: decoded.userId,
      username: profile.username || decoded.username,
      role: 'user',
    };

    next(); // Cho phép request tiếp tục vào Controller
  } catch (error) {
    console.error('Lỗi xác thực Token:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
      });
    }

    return res.status(401).json({
      message: 'Token xác thực không hợp lệ hoặc đã bị can thiệp.',
    });
  }
};

module.exports = authMiddleware;
