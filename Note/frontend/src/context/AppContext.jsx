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
  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loadingApp, setLoadingApp] = useState(true);
  const [appError, setAppError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => { applyUiPreferences(preferences); }, [preferences]);
  useEffect(() => {
    let active = true;
    // The notebook no longer uses account sessions; remove old login data.
    for (const storage of [localStorage, sessionStorage]) {
      for (const key of ['token', 'user', 'preferences']) storage.removeItem(key);
    }
    userService.getProfile().then((profile) => {
      if (!active) return;
      setUser(profile.user);
      setPreferences({ ...DEFAULT_PREFERENCES, ...profile.preferences });
      setAppError('');
    }).catch((error) => {
      if (active) setAppError(error.response?.data?.message || 'Không thể mở sổ tay. Hãy kiểm tra backend rồi thử lại.');
    }).finally(() => { if (active) setLoadingApp(false); });
    return () => { active = false; };
  }, [reloadVersion]);
  const reloadProfile = () => { setLoadingApp(true); setReloadVersion((version) => version + 1); };

  // Cập nhật Cài đặt giao diện
  const updatePreferences = async (newPrefs, { persist = true } = {}) => {
    const previous = preferences;
    const optimistic = { ...previous, ...newPrefs };

    setPreferences(optimistic);
    localStorage.setItem('preferences', JSON.stringify(optimistic));
    applyUiPreferences(optimistic);

    if (!persist) return optimistic;

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

  return (
    <AppContext.Provider
      value={{
        user,
        preferences,
        loadingApp,
        appError,
        reloadProfile,
        updatePreferences,
        updateUserProfile,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
