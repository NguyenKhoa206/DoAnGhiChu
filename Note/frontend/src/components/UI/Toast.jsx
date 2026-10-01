import React, { useEffect } from 'react';
import './Toast.css';
import Icon from './Icon';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  // Tự động đóng thông báo Toast sau khoảng thời gian `duration` (mặc định 3 giây)
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  // Lựa chọn icon phù hợp theo loại thông báo
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Icon name="check" />;
      case 'error':
        return <Icon name="alert" />;
      case 'warning':
        return <Icon name="alert" />;
      case 'info':
      default:
        return <Icon name="alert" />;
    }
  };

  return (
    <div className={`toast-notification toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={onClose} aria-label="Đóng thông báo">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};

export default Toast;