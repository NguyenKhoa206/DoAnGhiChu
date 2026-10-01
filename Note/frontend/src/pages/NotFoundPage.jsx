import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <div className="error-icon">🔍</div>
        <h2>Trang Không Tồn Tại</h2>
        <p>
          Đường dẫn bạn đang truy cập không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra lại URL.
        </p>
        <div className="not-found-actions">
          <button className="btn-go-back" onClick={() => navigate(-1)}>
            ← Quay lại trang trước
          </button>
          <button className="btn-go-home" onClick={() => navigate('/dashboard')}>
            🏠 Về Bảng Điều Khiển
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;