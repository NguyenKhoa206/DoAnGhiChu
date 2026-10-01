const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Bắt buộc xác thực Token trước khi thao tác với dữ liệu người dùng
router.use(authMiddleware);

/**
 * @route   GET /api/users/profile
 * @desc    Lấy thông tin cá nhân và cài đặt giao diện (UI preferences)
 */
router.get('/profile', userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Cập nhật hồ sơ cá nhân (displayName, email) và preferences (theme, primaryColor)
 */
router.put('/profile', userController.updateProfile);

/**
 * @route   PATCH /api/users/preferences
 * @desc    Cập nhật nhanh tùy chọn giao diện real-time
 */
router.patch('/preferences', userController.updatePreferences);

module.exports = router;