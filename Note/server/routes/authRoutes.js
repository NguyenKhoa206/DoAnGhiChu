const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// ==========================================
// 1. PUBLIC AUTH ROUTES (Không cần Token)
// ==========================================

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký tài khoản người dùng mới
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập hệ thống & nhận JWT Token
 */
router.post('/login', authController.login);

// ==========================================
// 2. PROTECTED AUTH ROUTES (Yêu cầu JWT Token)
// ==========================================

/**
 * @route   GET /api/auth/private-status
 * @desc    Kiểm tra xem người dùng đã cài mật khẩu vùng riêng tư chưa
 */
router.get('/private-status', authMiddleware, authController.checkPrivatePasswordStatus);

/**
 * @route   POST /api/auth/setup-private-password
 * @desc    Cài đặt mật khẩu vùng riêng tư lần đầu
 */
router.post('/setup-private-password', authMiddleware, authController.setupPrivatePassword);

/**
 * @route   POST /api/auth/verify-private-password
 * @desc    Xác thực mật khẩu vùng riêng tư khi truy cập tab riêng tư
 */
router.post('/verify-private-password', authMiddleware, authController.verifyPrivatePassword);

/**
 * @route   PUT /api/auth/change-private-password
 * @desc    Thay đổi mật khẩu vùng riêng tư
 */
router.put('/change-private-password', authMiddleware, authController.changePrivatePassword);

/**
 * @route   PUT /api/auth/change-account-password
 * @desc    Thay đổi mật khẩu đăng nhập tài khoản hệ thống
 */
router.put('/change-account-password', authMiddleware, authController.changeAccountPassword);

module.exports = router;