const fs = require('fs-extra');
const { readJsonFile, writeJsonFile } = require('../utils/read_write');
const { getAccountProfilePath } = require('../utils/accountStorage');
const { validPreferences, mergePreferences } = require('../utils/uiPreferences');

// ✅ Cố định chính xác vị trí vào: /server/data/users/
// __dirname là /server/controllers/ -> '../data/users' trỏ chuẩn về /server/data/users/
// Utility helper: Lấy đường dẫn tới file profile.json của user
const getUserProfilePath = (userId) => getAccountProfilePath(userId);

const userController = {
  /**
   * Lấy thông tin cá nhân & UI Preferences của người dùng đang đăng nhập
   * GET /api/users/profile
   */
  getProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const profilePath = getUserProfilePath(userId);

      if (!await fs.pathExists(profilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ người dùng.' });
      }

      const profile = await readJsonFile(profilePath);

      // Loại bỏ thông tin nhạy cảm trước khi trả về Frontend
      const safeProfile = { ...profile };
      delete safeProfile.passwordHash;
      delete safeProfile.privatePasswordHash;

      return res.status(200).json({
        user: {
          id: safeProfile.id,
          username: safeProfile.username,
          displayName: safeProfile.displayName,
          email: safeProfile.email,
          role: 'user',
          createdAt: safeProfile.createdAt,
          avatarDataUrl: safeProfile.avatarDataUrl || '',
        },
        preferences: safeProfile.preferences || {
          theme: 'light',
          primaryColor: '#2463eb',
        },
        hasPrivatePasswordSetup: Boolean(profile.privatePasswordHash),
      });
    } catch (error) {
      console.error('Lỗi khi lấy thông tin người dùng:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi tải thông tin cá nhân.' });
    }
  },

  /**
   * Cập nhật thông tin cá nhân và cài đặt giao diện (Ghi vào profile.json)
   * PUT /api/users/profile
   */
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { displayName, email, preferences, avatarDataUrl } = req.body;
      const profilePath = getUserProfilePath(userId);

      if (!await fs.pathExists(profilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ người dùng để cập nhật.' });
      }

      const profile = await readJsonFile(profilePath);

      if (displayName !== undefined && (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 80)) {
        return res.status(400).json({ message: 'Tên hiển thị cần từ 1 đến 80 ký tự.' });
      }
      if (email !== undefined && (typeof email !== 'string' || email.length > 254
        || (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())))) {
        return res.status(400).json({ message: 'Địa chỉ email không hợp lệ.' });
      }
      if (preferences !== undefined && !validPreferences(preferences)) {
        return res.status(400).json({ message: 'Tùy chọn giao diện không hợp lệ.' });
      }

      // Cập nhật tên hiển thị nếu có truyền vào
      if (displayName !== undefined) {
        profile.displayName = displayName.trim();
      }

      // Cập nhật email nếu có truyền vào
      if (email !== undefined) {
        profile.email = email.trim();
      }

      if (avatarDataUrl !== undefined) {
        if (typeof avatarDataUrl !== 'string' || (avatarDataUrl && (avatarDataUrl.length > 2_800_000
          || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarDataUrl)))) {
          return res.status(400).json({ message: 'Ảnh đại diện cần là PNG, JPG hoặc WebP và tối đa 2 MB.' });
        }
        profile.avatarDataUrl = avatarDataUrl;
      }

      // Cập nhật preferences (theme, primaryColor)
      if (preferences && typeof preferences === 'object') {
        profile.preferences = mergePreferences(profile.preferences, preferences);
      }

      profile.updatedAt = new Date().toISOString();

      // Ghi lại thông tin cập nhật vào profile.json
      await writeJsonFile(profilePath, profile);

      // Trả về dữ liệu đã cập nhật
      const updatedUser = { ...profile };
      delete updatedUser.passwordHash;
      delete updatedUser.privatePasswordHash;

      return res.status(200).json({
        message: 'Cập nhật thông tin cá nhân và cài đặt thành công.',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          displayName: updatedUser.displayName,
          email: updatedUser.email,
          role: 'user',
          avatarDataUrl: updatedUser.avatarDataUrl || '',
          createdAt: updatedUser.createdAt,
        },
        preferences: updatedUser.preferences,
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin cá nhân:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật hồ sơ người dùng.' });
    }
  },

  /**
   * Cập nhật nhanh cài đặt giao diện (Theme & Primary Color)
   * PATCH /api/users/preferences
   */
  updatePreferences: async (req, res) => {
    try {
      const userId = req.user.userId;
      if (!validPreferences(req.body)) {
        return res.status(400).json({ message: 'Tùy chọn giao diện không hợp lệ.' });
      }
      const profilePath = getUserProfilePath(userId);

      if (!await fs.pathExists(profilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy tệp cài đặt người dùng.' });
      }

      const profile = await readJsonFile(profilePath);

      profile.preferences = mergePreferences(profile.preferences, req.body);

      profile.updatedAt = new Date().toISOString();

      await writeJsonFile(profilePath, profile);

      return res.status(200).json({
        message: 'Cập nhật giao diện thành công.',
        preferences: profile.preferences,
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật cài đặt giao diện:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi lưu cài đặt giao diện.' });
    }
  },
};

module.exports = userController;
