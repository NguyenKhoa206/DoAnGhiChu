import React, { useState, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import ProfileMenu from '../User/ProfileMenu';
import Icon from '../UI/Icon';
import { AppContext } from '../../context/AppContextBase';
import './MainLayout.css';

const MainLayout = () => {
  // Đóng/mở sidebar trên giao diện mobile/tablet
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Lấy các giá trị UI Preferences từ AppContext
  const { preferences } = useContext(AppContext);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Lấy theme và màu chủ đạo (hoặc mặc định nếu chưa thiết lập)
  const theme = preferences?.theme || 'light';
  const isNotebookRoute = location.pathname === '/dashboard' || location.pathname.startsWith('/notes/');

  return (
    <div 
      className={`app-layout ${theme}`} 
    >
      {/* Overlay che nền khi mở sidebar trên màn hình nhỏ */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Thanh Sidebar điều hướng bên trái */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Vùng nội dung chính của trang */}
      <div className="main-wrapper">
        {/* Header trên cùng */}
        <header className="main-header">
          <div className="header-left">
            <button 
              className="sidebar-toggle-btn" 
              onClick={toggleSidebar} 
              aria-label="Mở menu điều hướng"
              aria-expanded={isSidebarOpen}
            >
              <Icon name="menu" />
            </button>
            <h1 className="header-title">{isNotebookRoute ? 'Không gian ghi chú' : ({ '/settings': 'Cài đặt', '/calendar': 'Lịch ghi chú', '/private-notes': 'Ghi chú riêng tư', '/trash': 'Thùng rác' }[location.pathname] || 'HKT — Sổ tay')}</h1>
          </div>

          <div className="header-right">
            {/* Component Menu tài khoản người dùng */}
            <ProfileMenu />
          </div>
        </header>

        {/* Nội dung động render theo Route (Router Outlet) */}
        <main className={'main-content' + (isNotebookRoute ? ' notebook-content' : '')}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
