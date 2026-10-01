import api from './api';

const userService = {
  // Lấy thông tin hồ sơ và cài đặt giao diện người dùng
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  // Cập nhật thông tin hồ sơ và giao diện
  updateProfile: async (profileData) => {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  // Cập nhật nhanh tùy chọn giao diện (Theme/Color)
  updatePreferences: async (preferences) => {
    const response = await api.patch('/users/preferences', preferences);
    return response.data;
  },
};

export default userService;