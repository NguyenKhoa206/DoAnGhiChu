import { useContext } from 'react';
import { AppContext } from '../context/AppContextBase';

/**
 * Custom hook useAuth giúp các components dễ dàng truy cập
 * và thao tác với thông tin xác thực/người dùng từ AppContext.
 */
const useAuth = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong <AppProvider>');
  }

  const {
    user,
    token,
    loadingApp,
    loginUser,
    logoutUser,
    updateUserProfile,
  } = context;

  // Kiểm tra xem người dùng đã đăng nhập hay chưa
  const isAuthenticated = Boolean(token && user);

  return {
    user,
    token,
    isAuthenticated,
    loadingApp,
    login: loginUser,
    logout: logoutUser,
    updateProfile: updateUserProfile,
  };
};

export default useAuth;
