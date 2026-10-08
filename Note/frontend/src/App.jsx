import React, { useContext } from 'react';
import { AppContext } from './context/AppContextBase';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Layout & Route Guards
import MainLayout from './components/Layouts/MainLayout';
// Sửa 2 dòng import bên dưới cho đúng vị trí thực tế trong thư mục src/routes/


// Pages
import DashboardPage from './pages/DashboardPage';
import PrivateNotePage from './pages/PrivateNotePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import CalendarPage from './pages/CalendarPage';
import TrashPage from './pages/TrashPage';

const DashboardRoute = () => {
  const location = useLocation();
  return <DashboardPage key={`${location.pathname}${location.search}`} />;
};

function NotebookRoutes() {
  const { loadingApp, appError, reloadProfile } = useContext(AppContext);
  if (loadingApp) return <div className="loading-spinner" role="status">Đang mở sổ tay…</div>;
  if (appError) return <div className="loading-spinner" role="alert"><p>{appError}</p><button type="button" onClick={reloadProfile}>Thử lại</button></div>;
  return <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<Navigate to="/dashboard" replace />} />
    <Route path="/register" element={<Navigate to="/dashboard" replace />} />
    <Route element={<MainLayout />}>
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/notes/:topicSlug" element={<DashboardRoute />} />
      <Route path="/private-notes" element={<PrivateNotePage />} />
      <Route path="/trash" element={<TrashPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="/404" element={<NotFoundPage />} />
    <Route path="*" element={<Navigate to="/404" replace />} />
  </Routes>;
}

function App() {
  return <AppProvider><BrowserRouter><NotebookRoutes /></BrowserRouter></AppProvider>;
}
export default App;
