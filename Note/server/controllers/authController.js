const path = require('node:path');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const { readJsonFile, writeJsonFile } = require('../utils/read_write');
const { getNotebookDir, getProfilePath } = require('../utils/notebookStorage');
const { createPrivateAccessToken } = require('../utils/privateAccess');
const { checkPrivatePassword, rejectPrivateLock, getPrivateAttemptStatus } = require('../utils/privateAttempts');

const authController = {
  checkPrivatePasswordStatus: async (req, res) => {
    try {
      const userId = req.user.userId;
      const profilePath = getProfilePath(userId);

      if (!await fs.pathExists(profilePath)) {
        return res.status(404).json({ message: 'Không tìm thấy thông tin cá nhân.' });
      }

      const profile = await readJsonFile(profilePath);
      const hasSetup = Boolean(profile.privatePasswordHash);

      return res.status(200).json({ hasSetup, ...(await getPrivateAttemptStatus()) });
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
      if (await rejectPrivateLock(res)) return;
      const { privatePassword } = req.body;

      if (typeof privatePassword !== 'string' || !privatePassword.trim() || privatePassword.length < 6 || Buffer.byteLength(privatePassword, 'utf8') > 72) {
        return res.status(400).json({ message: 'Mật khẩu riêng tư cần từ 6 ký tự và tối đa 72 byte.' });
      }

      const profilePath = getProfilePath(userId);
      const profile = await readJsonFile(profilePath);

      if (!profile) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });
      if (profile.privatePasswordHash) {
        return res.status(409).json({ message: 'Mật khẩu riêng tư đã được thiết lập. Hãy nhập mật khẩu hiện tại để đổi mật khẩu.' });
      }

      const privatePasswordHash = await bcrypt.hash(privatePassword, 10);
      profile.privatePasswordHash = privatePasswordHash;
      profile.updatedAt = new Date().toISOString();

      await writeJsonFile(profilePath, profile);

      const privateFilePath = path.join(getNotebookDir(userId), 'private.json');
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
      if (await rejectPrivateLock(res)) return;
      const privatePassword = req.body.privatePassword ?? req.body.password;

      if (typeof privatePassword !== 'string' || !privatePassword.trim()
        || Buffer.byteLength(privatePassword, 'utf8') > 72) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu riêng tư hợp lệ.' });
      }

      const profile = await readJsonFile(getProfilePath(userId));
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản.' });
      }
      if (!profile.privatePasswordHash) {
        return res.status(400).json({ success: false, message: 'Chưa cài đặt mật khẩu vùng riêng tư.' });
      }

      if (!await checkPrivatePassword(privatePassword, profile.privatePasswordHash, res)) return;

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
      if (await rejectPrivateLock(res)) return;
      const { currentPassword, newPassword, encryptedNotes, encryptedPrivateTrashNotes = [] } = req.body;
      if (typeof currentPassword !== 'string' || !currentPassword || typeof newPassword !== 'string' || !newPassword.trim() || newPassword.length < 6 || Buffer.byteLength(newPassword, 'utf8') > 72) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại là bắt buộc; mật khẩu mới cần từ 6 ký tự và tối đa 72 byte.' });
      }
      if (!Array.isArray(encryptedNotes) || encryptedNotes.length > 5000) {
        return res.status(400).json({ message: 'Không thể đổi mật khẩu vì danh sách ghi chú riêng tư chưa được gửi đúng định dạng.' });
      }
      if (!Array.isArray(encryptedPrivateTrashNotes) || encryptedPrivateTrashNotes.length > 5000) {
        return res.status(400).json({ message: 'Không thể đổi mật khẩu vì thùng rác riêng tư chưa được gửi đúng định dạng.' });
      }

      const profilePath = getProfilePath(userId);
      const profile = await readJsonFile(profilePath);
      if (!profile) return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản.' });

      if (!profile.privatePasswordHash) {
        return res.status(400).json({ message: 'Bạn chưa cài đặt mật khẩu riêng tư.' });
      }

      if (!await checkPrivatePassword(currentPassword, profile.privatePasswordHash, res)) return;

      const accountDir = getNotebookDir(userId);
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

};

module.exports = authController;
