import React, { useState, useEffect } from 'react';
import userService from '../services/userService';
import { AppContext } from './AppContextBase';

const DEFAULT_PREFERENCES = {
  theme: 'light',
  primaryColor: '#2463eb',
  noteLayout: 'table',
  noteSort: 'newest',
  density: 'comfortable',
};

const applyUiPreferences = (prefs) => {
  const currentTheme = prefs?.theme || DEFAULT_PREFERENCES.theme;
  const currentPrimaryColor = prefs?.primaryColor || DEFAULT_PREFERENCES.primaryColor;
  const root = document.documentElement;

  if (currentTheme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }

  root.style.setProperty('--primary-color', currentPrimaryColor);
  root.dataset.density = prefs?.density === 'compact' ? 'compact' : 'comfortable';
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!savedUser) return null;
    try { return JSON.parse(savedUser); } catch { return null; }
  });

  const [token, setToken] = useState(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token') || null;
    if (savedToken && !localStorage.getItem('token')) localStorage.setItem('token', savedToken);
    sessionStorage.removeItem('token');
    return savedToken;
  });

  const [preferences, setPreferences] = useState(() => {
    const savedPrefs = localStorage.getItem('preferences') || sessionStorage.getItem('preferences');
    if (!savedPrefs) return DEFAULT_PREFERENCES;
    try { return JSON.parse(savedPrefs); } catch { return DEFAULT_PREFERENCES; }
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser && !localStorage.getItem('user')) localStorage.setItem('user', storedUser);
    sessionStorage.removeItem('user');
    const storedPreferences = localStorage.getItem('preferences') || sessionStorage.getItem('preferences');
    if (storedPreferences && !localStorage.getItem('preferences')) localStorage.setItem('preferences', storedPreferences);
    sessionStorage.removeItem('preferences');
  }, []);

  const [loadingApp, setLoadingApp] = useState(true);

  useEffect(() => {
    applyUiPreferences(preferences);
  }, [preferences]);

  // Đồng bộ Profile từ Backend khi ứng dụng khởi chạy có Token[cite: 3, 4]
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!token) {
        setLoadingApp(false);
        return;
      }

      try {
        const response = await userService.getProfile();
        const profileData = response.data || response;

        if (profileData) {
          if (profileData.user) {
            setUser(profileData.user);
            localStorage.setItem('user', JSON.stringify(profileData.user));
          }

          if (profileData.preferences) {
            setPreferences(profileData.preferences);
            localStorage.setItem('preferences', JSON.stringify(profileData.preferences));
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải thông tin cá nhân:', error);
      } finally {
        setLoadingApp(false);
      }
    };

    fetchUserProfile();
  }, [token]);

  // Cập nhật Cài đặt giao diện
  const updatePreferences = async (newPrefs, { persist = true } = {}) => {
    const previous = preferences;
    const optimistic = { ...previous, ...newPrefs };

    setPreferences(optimistic);
    localStorage.setItem('preferences', JSON.stringify(optimistic));
    applyUiPreferences(optimistic);

    if (!persist || !token) return optimistic;

    try {
      const response = await userService.updatePreferences(newPrefs);
      const saved = { ...optimistic, ...(response.preferences || {}) };
      setPreferences(saved);
      localStorage.setItem('preferences', JSON.stringify(saved));
      applyUiPreferences(saved);
      return saved;
    } catch (error) {
      setPreferences(previous);
      localStorage.setItem('preferences', JSON.stringify(previous));
      applyUiPreferences(previous);
      throw error;
    }
  };

  // Cập nhật Thông tin cá nhân người dùng[cite: 3, 4]
  const updateUserProfile = (updatedUserFields) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedUserFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Đăng nhập người dùng
  const loginUser = (userData, userToken, userPrefs) => {
    setUser(userData);
    setToken(userToken);

    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');

    if (userPrefs) {
      setPreferences(userPrefs);
      localStorage.setItem('preferences', JSON.stringify(userPrefs));
      applyUiPreferences(userPrefs);
    }
  };

  // Đăng xuất người dùng[cite: 3]
  const logoutUser = () => {
    setUser(null);
    setToken(null);
    setPreferences(DEFAULT_PREFERENCES);

    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('preferences');

    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('preferences');

    applyUiPreferences(DEFAULT_PREFERENCES);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        preferences,
        loadingApp,
        loginUser,
        logoutUser,
        updatePreferences,
        updateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
