import axios from 'axios';

// Lấy URL Backend từ biến môi trường .env hoặc mặc định
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Hạn định thời gian request (10s)
});

// Giữ phiên đăng nhập qua lần đóng/mở web bằng localStorage.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho Response: Xử lý tập trung các lỗi HTTP (như 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isPrivateError = ['PRIVATE_PASSWORD_INVALID', 'PRIVATE_LOCKED'].includes(error.response?.data?.code);
    const isUnauthorized = status === 401 && !isPrivateError;

    if (isUnauthorized) {
      // Xóa phiên hiện tại ngay khi server báo tài khoản bị khóa hoặc token không còn hợp lệ.
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('preferences');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('preferences');

      // Không chuyển trang khi đang đăng nhập; trang login sẽ hiển thị thông báo từ API.
      const isAuthPage = /\/(login|register)\/?$/.test(window.location.pathname);
      if (!isAuthPage) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
