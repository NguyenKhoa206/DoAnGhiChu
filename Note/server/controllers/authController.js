const path = require('path');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readJsonFile, writeJsonFile } = require('../utils/read_write');
const { USERS_DATA_DIR, getAccountDir, getAccountProfilePath } = require('../utils/accountStorage');
const { createPrivateAccessToken } = require('../utils/privateAccess');

// ✅ Cố định chính xác đường dẫn vào: /server/data/users/
// __dirname là /server/controllers/ -> '../data/users' trỏ chuẩn về /server/data/users/
const JWT_SECRET = require('../config/jwt');
const SESSION_TOKEN_LIFETIME = '365d';

// Utility helper: Tìm profile người dùng theo username
const findUserByUsername = async (username) => {
  if (!await fs.pathExists(USERS_DATA_DIR)) return null;
  const userFolders = await fs.readdir(USERS_DATA_DIR);
  for (const userId of userFolders) {
    const profilePath = path.join(USERS_DATA_DIR, userId, 'profile.json');
    if (await fs.pathExists(profilePath)) {
      const profile = await readJsonFile(profilePath);
      if (profile?.username?.toLowerCase() === username.toLowerCase()) {
        return { userId, profile, profilePath };
      }
    }
  }
  return null;
};

const authController = {
  /**
   * Đăng ký tài khoản người dùng mới
   * POST /api/auth/register
   */
  register: async (req, res) => {
    try {
      const { username, displayName, email, password } = req.body;

      if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 32
        || !/^[a-zA-Z0-9_.-]+$/.test(username.trim())
        || typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 80
        || typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' });
      }
      if (email !== undefined && (typeof email !== 'string' || email.length > 254
        || (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())))) {
        return res.status(400).json({ message: 'Địa chỉ email không hợp lệ.' });
      }

      // Kiểm tra username đã tồn tại chưa
      const existingUser = await findUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã được sử dụng.' });
      }

      // Khởi tạo userId (slug dạng user-timestamp)
      const userId = `user_${Date.now()}`;
      const userFolderPath = path.join(USERS_DATA_DIR, userId);

      // Hash mật khẩu tài khoản
      const passwordHash = await bcrypt.hash(password, 10);

      // Tạo nội dung profile.json chuẩn[cite: 3]
      const profileData = {
        id: userId,
        username: username.trim(),
        displayName: displayName.trim(),
        email: email ? email.trim() : '',
        role: 'user',
        preferences: {
          theme: 'light',
          primaryColor: '#2463eb',
        },
        passwordHash,
        privatePasswordHash: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Chỉ tạo hồ sơ khi đăng ký; dữ liệu ghi chú được tạo khi người dùng sử dụng chức năng đó.
      await writeJsonFile(path.join(userFolderPath, 'profile.json'), profileData);


      // Tạo JWT Token
      const token = jwt.sign(
        { userId: profileData.id, username: profileData.username, scope: 'account' },
        JWT_SECRET,
        { expiresIn: SESSION_TOKEN_LIFETIME }
      );

      // Trả về kết quả (đã ẩn passwordHash)
      delete profileData.passwordHash;
      return res.status(201).json({
        message: 'Đăng ký tài khoản thành công.',
        token,
        user: profileData,
        preferences: profileData.preferences,
      });
    } catch (error) {
      console.error('Lỗi khi đăng ký tài khoản:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký tài khoản.' });
    }
  },

  /**
   * Đăng nhập tài khoản hệ thống
   * POST /api/auth/login
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập Tên đăng nhập và Mật khẩu.' });
      }

      const userData = await findUserByUsername(username);
      if (!userData) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const { profile } = userData;
      const isMatch = profile.passwordHash
        ? await bcrypt.compare(password, profile.passwordHash)
        : false;
      if (!isMatch) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      const token = jwt.sign(
        { userId: profile.id, username: profile.username, scope: 'account' },
        JWT_SECRET,
        { expiresIn: SESSION_TOKEN_LIFETIME }
      );

      const userResponse = { ...profile, role: 'user' };
      delete userResponse.passwordHash;
      delete userResponse.privatePasswordHash;

      return res.status(200).json({
        message: 'Đăng nhập thành công.',
        token,
        user: userResponse,
        preferences: profile.preferences || { theme: 'light', primaryColor: '#2463eb' },
      });
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi xử lý đăng nhập.' });
    }
  },

  /**
   * Kiểm tra trạng thái thiết lập mật khẩu vùng riêng tư
   * GET /api/auth/private-status
   */
  checkPrivatePasswordStatus: async (req, res) => {
    try {
      const userId = req.user.userId;
      const profilePath = getAccountProfilePath(userId);

      if (!await fs.pathExists(profilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin cá nhân.' });
      }

      const profile = await readJsonFile(profilePath);
      const hasSetup = Boolean(profile.privatePasswordHash);

      return res.status(200).json({ hasSetup });
    } catch (error) {
      console.error('Lỗi kiểm tra trạng thái mật khẩu riêng tư:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi kiểm tra bảo mật.' });
    }
  },

  /**
   * Khởi tạo mật khẩu vùng riêng tư lần đầu
   * POST /api/auth/setup-private-password
   */
  setupPrivatePassword: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { privatePassword } = req.body;

      if (typeof privatePassword !== 'string' || privatePassword.length < 6 || Buffer.byteLength(privatePassword, 'utf8') > 72) {
        return res.status(400).json({ message: 'Mật khẩu riêng tư cần từ 6 ký tự và tối đa 72 byte.' });
      }

      const profilePath = getAccountProfilePath(userId);
      const profile = await readJsonFile(profilePath);

      if (!profile) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
      if (profile.privatePasswordHash) {
        return res.status(409).json({ message: 'Mật khẩu riêng tư đã được thiết lập. Hãy nhập mật khẩu hiện tại để đổi mật khẩu.' });
      }

      const privatePasswordHash = await bcrypt.hash(privatePassword, 10);
      profile.privatePasswordHash = privatePasswordHash;
      profile.updatedAt = new Date().toISOString();

      await writeJsonFile(profilePath, profile);

      const privateFilePath = path.join(getAccountDir(userId), 'private.json');
      if (!await fs.pathExists(privateFilePath)) await writeJsonFile(privateFilePath, []);

      return res.status(200).json({
        success: true,
        privateToken: createPrivateAccessToken(userId, privatePasswordHash),
        message: 'Khởi tạo mật khẩu vùng riêng tư thành công.',
      });
    } catch (error) {
      console.error('Lỗi thiết lập mật khẩu riêng tư:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi cài đặt mật khẩu riêng tư.' });
    }
  },

  /**
   * POST /api/private/auth (legacy: /api/auth/verify-private-password)
   * Returns a short-lived private grant only after checking the password.
   */
  verifyPrivatePassword: async (req, res) => {
    try {
      const userId = req.user.userId;
      const privatePassword = req.body.privatePassword ?? req.body.password;

      if (typeof privatePassword !== 'string' || !privatePassword
        || Buffer.byteLength(privatePassword, 'utf8') > 72) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu riêng tư hợp lệ.' });
      }

      const profile = await readJsonFile(getAccountProfilePath(userId));
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
      }
      if (!profile.privatePasswordHash) {
        return res.status(400).json({ success: false, message: 'Chưa cài đặt mật khẩu vùng riêng tư.' });
      }

      if (!await bcrypt.compare(privatePassword, profile.privatePasswordHash)) {
        return res.status(401).json({
          success: false,
          code: 'PRIVATE_PASSWORD_INVALID',
          message: 'Sai mật khẩu riêng tư. Vui lòng thử lại.',
        });
      }

      return res.status(200).json({
        success: true,
        privateToken: createPrivateAccessToken(userId, profile.privatePasswordHash),
        message: 'Xác thực mật khẩu thành công.',
      });
    } catch (error) {
      console.error('Lỗi xác thực mật khẩu riêng tư:', error);
      return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xác thực mật khẩu riêng tư.' });
    }
  },

  /**
   * Thay đổi mật khẩu vùng riêng tư
   * PUT /api/auth/change-private-password
   */
  changePrivatePassword: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword, encryptedNotes, encryptedPrivateTrashNotes = [] } = req.body;
      if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || newPassword.length < 6 || Buffer.byteLength(newPassword, 'utf8') > 72) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại là bắt buộc; mật khẩu mới cần từ 6 ký tự và tối đa 72 byte.' });
      }
      if (!Array.isArray(encryptedNotes) || encryptedNotes.length > 5000) {
        return res.status(400).json({ message: 'Không thể đổi mật khẩu vì danh sách ghi chú riêng tư chưa được gửi đúng định dạng.' });
      }
      if (!Array.isArray(encryptedPrivateTrashNotes) || encryptedPrivateTrashNotes.length > 5000) {
        return res.status(400).json({ message: 'Không thể đổi mật khẩu vì thùng rác riêng tư chưa được gửi đúng định dạng.' });
      }

      const profilePath = getAccountProfilePath(userId);
      const profile = await readJsonFile(profilePath);
      if (!profile) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });

      if (!profile.privatePasswordHash) {
        return res.status(400).json({ message: 'Bạn chưa cài đặt mật khẩu riêng tư.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, profile.privatePasswordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu riêng tư hiện tại không đúng.' });
      }

      const accountDir = getAccountDir(userId);
      const privateNotesPath = path.join(accountDir, 'private.json');
      const privateTrashPath = path.join(accountDir, 'private-trash.json');
      const currentNotes = await readJsonFile(privateNotesPath) || [];
      const currentTrash = await readJsonFile(privateTrashPath) || [];
      if (!Array.isArray(currentNotes) || !Array.isArray(currentTrash)) {
        return res.status(500).json({ message: 'Danh sách ghi chú riêng tư bị lỗi định dạng.' });
      }
      const replacements = new Map();
      for (const note of encryptedNotes) {
        if (!note || typeof note.id !== 'string' || typeof note.title !== 'string' || !note.title
          || typeof note.content !== 'string' || note.title.length > 1_000_000 || note.content.length > 8_000_000
          || (note.metadata !== undefined && (typeof note.metadata !== 'string' || note.metadata.length > 8_000_000))
          || replacements.has(note.id)) {
          return res.status(400).json({ message: 'Một hoặc nhiều ghi chú chưa được mã hóa lại đúng cách.' });
        }
        replacements.set(note.id, note);
      }
      if (replacements.size !== currentNotes.length || currentNotes.some((note) => !replacements.has(note.id))) {
        return res.status(409).json({ message: 'Danh sách ghi chú đã thay đổi. Hãy tải lại trang cài đặt rồi thử lại.' });
      }

      const trashReplacements = new Map();
      for (const note of encryptedPrivateTrashNotes) {
        if (!note || typeof note.id !== 'string' || typeof note.title !== 'string' || !note.title
          || typeof note.content !== 'string' || note.title.length > 1_000_000 || note.content.length > 8_000_000
          || (note.metadata !== undefined && (typeof note.metadata !== 'string' || note.metadata.length > 8_000_000))
          || trashReplacements.has(note.id)) {
          return res.status(400).json({ message: 'Một hoặc nhiều ghi chú trong thùng rác chưa được mã hóa lại đúng cách.' });
        }
        trashReplacements.set(note.id, note);
      }
      if (trashReplacements.size !== currentTrash.length || currentTrash.some((note) => !trashReplacements.has(note.id))) {
        return res.status(409).json({ message: 'Thùng rác riêng tư đã thay đổi. Hãy tải lại trang cài đặt rồi thử lại.' });
      }

      const updatedNotes = currentNotes.map((note) => ({
        ...note,
        title: replacements.get(note.id).title,
        content: replacements.get(note.id).content,
        ...(replacements.get(note.id).metadata !== undefined ? { metadata: replacements.get(note.id).metadata } : {}),
      }));
      const updatedTrash = currentTrash.map((note) => ({
        ...note,
        title: trashReplacements.get(note.id).title,
        content: trashReplacements.get(note.id).content,
        ...(trashReplacements.get(note.id).metadata !== undefined ? { metadata: trashReplacements.get(note.id).metadata } : {}),
      }));
      const updatedProfile = {
        ...profile,
        privatePasswordHash: await bcrypt.hash(newPassword, 10),
        updatedAt: new Date().toISOString(),
      };

      try {
        await writeJsonFile(privateNotesPath, updatedNotes);
        await writeJsonFile(privateTrashPath, updatedTrash);
        await writeJsonFile(profilePath, updatedProfile);
      } catch (writeError) {
        await writeJsonFile(privateNotesPath, currentNotes);
        await writeJsonFile(privateTrashPath, currentTrash);
        throw writeError;
      }

      return res.status(200).json({ message: 'Thay đổi mật khẩu vùng riêng tư thành công.' });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu riêng tư:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi đổi mật khẩu riêng tư.' });
    }
  },

  /**
   * Thay đổi mật khẩu đăng nhập tài khoản
   * PUT /api/auth/change-account-password
   */
  changeAccountPassword: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;
      if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || newPassword.length < 6 || Buffer.byteLength(newPassword, 'utf8') > 72) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại là bắt buộc; mật khẩu mới cần từ 6 ký tự và tối đa 72 byte.' });
      }

      const profilePath = getAccountProfilePath(userId);
      if (!await fs.pathExists(profilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy hồ sơ tài khoản.' });
      }
      const profile = await readJsonFile(profilePath);
      if (!profile?.passwordHash) {
        return res.status(409).json({ message: 'Tài khoản chưa có mật khẩu đăng nhập hợp lệ.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, profile.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu đăng nhập hiện tại không đúng.' });
      }

      profile.passwordHash = await bcrypt.hash(newPassword, 10);
      profile.updatedAt = new Date().toISOString();

      await writeJsonFile(profilePath, profile);

      return res.status(200).json({ message: 'Đổi mật khẩu tài khoản thành công.' });
    } catch (error) {
      console.error('Lỗi đổi mật khẩu tài khoản:', error);
      return res.status(500).json({ message: 'Lỗi hệ thống khi đổi mật khẩu đăng nhập.' });
    }
  },
};

module.exports = authController;
