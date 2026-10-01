import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Layout & Route Guards
import MainLayout from './components/Layouts/MainLayout';
// Sửa 2 dòng import bên dưới cho đúng vị trí thực tế trong thư mục src/routes/
import PrivateRoute from './routes/PrivateRoute'; 

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* 1. Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 2. Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/notes/:topicSlug" element={<DashboardRoute />} />
              <Route path="/private-notes" element={<PrivateNotePage />} />
              <Route path="/trash" element={<TrashPage />} />
              <Route path="/settings" element={<SettingsPage />} />

            </Route>
          </Route>


          {/* 3. Handling 404 Not Found Routes */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
