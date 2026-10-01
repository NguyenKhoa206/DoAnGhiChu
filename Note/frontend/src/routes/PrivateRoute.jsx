import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PrivateRoute = () => {
  const { isAuthenticated, loadingApp } = useAuth();
  const location = useLocation();

  if (loadingApp) {
    return (
      <div className="loading-spinner" style={{ padding: '40px', textAlign: 'center' }}>
        ⏳ Đang xác thực phiên đăng nhập...
      </div>
    );
  }

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default PrivateRoute;