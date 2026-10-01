import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import AuthLayout from '../components/Public/AuthLayout';
import PublicIcon from '../components/Public/PublicIcon';
import PasswordInput from '../components/Public/PasswordInput';
import './RegisterPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '', displayName: '', email: '', password: '', confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setError('');
    setErrorField('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setErrorField('');

    const { username, displayName, email, password, confirmPassword } = formData;
    const rejectField = (field, message) => {
      setError(message);
      setErrorField(field);
      event.currentTarget.elements.namedItem(field)?.focus();
    };

    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username.trim())) {
      rejectField('username', 'Tên đăng nhập cần 3–32 ký tự, gồm chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.');
      return;
    }
    if (!displayName.trim() || displayName.trim().length > 80) {
      rejectField('displayName', 'Vui lòng nhập tên hiển thị, tối đa 80 ký tự.');
      return;
    }
    if (email.trim() && (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      rejectField('email', 'Vui lòng nhập địa chỉ email hợp lệ hoặc để trống.');
      return;
    }
    if (password.length < 6) {
      rejectField('password', 'Mật khẩu cần ít nhất 6 ký tự.');
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      rejectField('password', 'Mật khẩu quá dài. Vui lòng sử dụng mật khẩu ngắn hơn.');
      return;
    }
    if (password !== confirmPassword) {
      rejectField('confirmPassword', 'Mật khẩu xác nhận chưa trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        username: username.trim(), displayName: displayName.trim(), email: email.trim(), password,
      });
      const { user, token, preferences } = response.data || response;
      if (user && token) {
        login(user, token, preferences);
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/login', { replace: true, state: { registered: true } });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Chưa thể tạo tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (name, hint) => [hint, errorField === name ? 'register-error' : ''].filter(Boolean).join(' ') || undefined;

  return (
    <AuthLayout mode="register">
      <form className="auth-form register-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        {error && <div className="auth-feedback" id="register-error" role="alert"><PublicIcon name="alert" /><span>{error}</span></div>}
        <div className="register-name-row">
          <div className="auth-field">
            <label htmlFor="register-username">Tên đăng nhập</label>
            <div className="auth-input-wrap">
              <PublicIcon name="user" className="auth-input-icon" />
              <input id="register-username" name="username" type="text" placeholder="Ví dụ: anhkhoa" value={formData.username} onChange={handleChange} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={32} required disabled={loading} aria-invalid={errorField === 'username' || undefined} aria-describedby={fieldError('username', 'register-username-hint')} />
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="register-display-name">Tên hiển thị</label>
            <div className="auth-input-wrap">
              <PublicIcon name="user" className="auth-input-icon" />
              <input id="register-display-name" name="displayName" type="text" placeholder="Tên của bạn" value={formData.displayName} onChange={handleChange} autoComplete="nickname" maxLength={80} required disabled={loading} aria-invalid={errorField === 'displayName' || undefined} aria-describedby={fieldError('displayName')} />
            </div>
          </div>
        </div>
        <p className="auth-field-hint register-username-hint" id="register-username-hint">Tên đăng nhập dùng 3–32 ký tự không dấu, không có khoảng trắng.</p>
        <div className="auth-field">
          <label htmlFor="register-email">Email<span>Không bắt buộc</span></label>
          <div className="auth-input-wrap">
            <PublicIcon name="mail" className="auth-input-icon" />
            <input id="register-email" name="email" type="email" placeholder="ban@example.com" value={formData.email} onChange={handleChange} autoComplete="email" autoCapitalize="none" spellCheck={false} maxLength={254} disabled={loading} aria-invalid={errorField === 'email' || undefined} aria-describedby={fieldError('email')} />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="register-password">Mật khẩu</label>
          <PasswordInput id="register-password" name="password" placeholder="Tạo mật khẩu của bạn" value={formData.password} onChange={handleChange} autoComplete="new-password" maxLength={72} required disabled={loading} aria-invalid={errorField === 'password' || undefined} aria-describedby={fieldError('password', 'register-password-hint')} />
          <p className="auth-field-hint" id="register-password-hint">Ít nhất 6 ký tự. Hãy chọn mật khẩu khó đoán.</p>
        </div>
        <div className="auth-field">
          <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
          <PasswordInput id="register-confirm-password" name="confirmPassword" label="mật khẩu xác nhận" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} autoComplete="new-password" maxLength={72} required disabled={loading} aria-invalid={errorField === 'confirmPassword' || undefined} aria-describedby={fieldError('confirmPassword')} />
        </div>
        <button type="submit" className="public-button public-button--primary auth-submit" disabled={loading}>
          {loading ? <><span className="public-spinner" aria-hidden="true" />Đang tạo tài khoản…</> : <>Tạo tài khoản<PublicIcon name="arrow" /></>}
        </button>
        <p className="auth-session-hint"><PublicIcon name="notebook" />Bắt đầu ghi chú, Lưu lại những thông tin quan trọng.</p>
      </form>
    </AuthLayout>
  );
}
