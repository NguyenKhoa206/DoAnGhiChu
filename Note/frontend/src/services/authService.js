import api from './api.js';

const authService = {
  /**
   * Đăng ký tài khoản người dùng mới
   * POST /api/auth/register
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  /**
   * Đăng nhập tài khoản hệ thống
   * POST /api/auth/login
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    
    // Lưu phiên đăng nhập bền vững qua các lần đóng/mở web.
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
    
    return response.data;
  },

  /**
   * Đăng xuất - Xóa phiên đăng nhập khi người dùng chủ động đăng xuất
   */
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('preferences');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('preferences');
  },

  /**
   * Lấy Token hiện tại từ localStorage
   */
  getToken: () => {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
  },

  /**
   * Lấy thông tin User hiện tại từ localStorage
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Kiểm tra xem người dùng đã từng thiết lập mật khẩu vùng riêng tư chưa
   * GET /api/auth/private-status
   */
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

  /**
   * Thay đổi mật khẩu đăng nhập tài khoản hệ thống
   * PUT /api/auth/change-account-password
   */
  changeAccountPassword: async ({ currentPassword, newPassword }) => {
    const response = await api.put('/auth/change-account-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
