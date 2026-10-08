import React, { useEffect, useRef, useState } from 'react';
import privateService from '../../services/privateService';
import './PrivateAuthModal.css';
import Icon from './Icon';

const PrivateAuthForm = ({ onClose, onSuccess, isFirstTime = false, initialLockedUntil }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(() => initialLockedUntil || 0);
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  useEffect(() => {
    if (initialLockedUntil !== undefined) return;
    let active = true;
    privateService.checkPrivatePasswordStatus().then((status) => { if (active) { setLockedUntil((previous) => Math.max(previous, status.lockedUntil || 0)); setNow(Date.now()); } }).catch(() => {});
    return () => { active = false; };
  }, [initialLockedUntil]);
  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);
  const passwordInputRef = useRef(null);

  // Xử lý khi Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || remaining) return;
    setError('');

    // Validate dữ liệu cơ bản ở Frontend
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu riêng tư.');
      return;
    }

    if (isFirstTime) {
      if (password.length < 6 || new TextEncoder().encode(password).length > 72) {
        setError('Mật khẩu riêng tư cần từ 6 ký tự và tối đa 72 byte.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setLoading(true);

    try {
      const result = isFirstTime
        ? await privateService.setupPrivatePassword(password)
        : await privateService.verifyPrivatePassword(password);
      if (result?.success !== true || typeof result.privateToken !== 'string') {
        throw new Error('Không thể mở khóa vùng riêng tư. Vui lòng thử lại.');
      }
      onSuccess(password, result.privateToken);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err.response?.data?.code === 'PRIVATE_RATE_LIMITED') {
        setLockedUntil(err.response.data.lockedUntil);
        setNow(Date.now());
      }
      setPassword('');
      setConfirmPassword('');
      setError(
        err.response?.data?.message || err.message || 'Lỗi xác thực mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
      requestAnimationFrame(() => passwordInputRef.current?.focus());
    }
  };

  return (
    <div className="modal-overlay">
      <div className="private-auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {isFirstTime
              ? 'Thiết lập mật khẩu riêng tư'
              : 'Mở khóa ghi chú riêng tư'}
          </h3>
          <button type="button" className="close-btn" onClick={onClose} disabled={loading} aria-label="Đóng">
            <Icon name="close" size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-description">
              {isFirstTime
                ? 'Đây là lần đầu tiên bạn truy cập Vùng Riêng Tư. Vui lòng tạo mật khẩu bảo vệ cho các ghi chú nhạy cảm của bạn.'
                : 'Vui lòng nhập mật khẩu riêng tư để mở khóa và xem danh sách ghi chú bảo mật.'}
            </p>

            {remaining > 0 && <div className="auth-error-message" role="status">Vùng riêng tư tạm khóa. Thử lại sau {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}.</div>}
            {!remaining && error && <div className="auth-error-message" role="alert">{error}</div>}

            <div className="form-group">
              <label htmlFor="private-password">
                {isFirstTime ? 'Mật khẩu riêng tư mới' : 'Mật khẩu riêng tư'}
              </label>
              <input
                id="private-password"
                ref={passwordInputRef}
                type="password"
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                disabled={loading || Boolean(remaining)}
              />
            </div>

            {isFirstTime && (
              <div className="form-group">
                <label htmlFor="confirm-private-password">Xác nhận mật khẩu</label>
                <input
                  id="confirm-private-password"
                  type="password"
                  placeholder="Nhập lại mật khẩu mới..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading || Boolean(remaining)}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={loading || Boolean(remaining)}>
              {loading
                ? 'Đang xử lý...'
                : isFirstTime
                ? 'Lưu Mật Khẩu'
                : 'Mở Khóa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Closing the modal unmounts the form, clearing its password and error state.
const PrivateAuthModal = ({ isOpen, ...props }) => isOpen
  ? <PrivateAuthForm key={String(props.isFirstTime)} {...props} /> : null;

export default PrivateAuthModal;
