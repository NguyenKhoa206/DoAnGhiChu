import api from './api.js';

const privateService = {
  checkPrivatePasswordStatus: async () => {
    const response = await api.get('/auth/private-status');
    return response.data;
  },

  /**
   * Khởi tạo mật khẩu riêng tư lần đầu (First-time setup)
   * POST /api/auth/setup-private-password
   */
  setupPrivatePassword: async (privatePassword) => {
    const response = await api.post('/auth/setup-private-password', {
      privatePassword,
    });
    return response.data;
  },

  /**
   * Xác thực mật khẩu riêng tư khi người dùng truy cập
   * POST /api/private/auth - trả về success và privateToken
   */
  verifyPrivatePassword: async (privatePassword) => {
    const response = await api.post('/private/auth', { password: privatePassword });
    return response.data;
  },

  /**
   * Thay đổi mật khẩu vùng riêng tư
   * PUT /api/auth/change-private-password
   */
  changePrivatePassword: async ({ currentPassword, newPassword, encryptedNotes, encryptedPrivateTrashNotes = [] }) => {
    const response = await api.put('/auth/change-private-password', {
      currentPassword,
      newPassword,
      encryptedNotes,
      encryptedPrivateTrashNotes,
    });
    return response.data;
  },

};

export default privateService;
