import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import AuthLayout from '../components/Public/AuthLayout';
import PublicIcon from '../components/Public/PublicIcon';
import PasswordInput from '../components/Public/PasswordInput';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState('');
  const destination = location.state?.from;
  const from = destination?.pathname
    ? destination.pathname + (destination.search || '') + (destination.hash || '')
    : '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const clearError = () => {
    setError('');
    setErrorField('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    clearError();

    if (!username.trim() || !password) {
      const field = !username.trim() ? 'username' : 'password';
      setError(field === 'username' ? 'Vui lòng nhập tên đăng nhập.' : 'Vui lòng nhập mật khẩu.');
      setErrorField(field);
      event.currentTarget.elements.namedItem(field)?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({ username: username.trim(), password });
      const { user, token, preferences } = response.data || response;
      if (!user || !token) throw new Error('Chưa thể đăng nhập. Vui lòng thử lại.');
      login(user, token, preferences);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="login">
      {location.state?.registered && (
        <div className="auth-feedback auth-feedback--success" role="status"><PublicIcon name="check" />Tài khoản đã được tạo. Bạn có thể đăng nhập ngay.</div>
      )}
      <form className="auth-form login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
        {error && <div className="auth-feedback" id="login-error" role="alert"><PublicIcon name="alert" /><span>{error}</span></div>}
        <div className="auth-field">
          <label htmlFor="login-username">Tên đăng nhập</label>
          <div className="auth-input-wrap">
            <PublicIcon name="user" className="auth-input-icon" />
            <input id="login-username" name="username" type="text" placeholder="Tên đăng nhập của bạn" value={username} onChange={(event) => { setUsername(event.target.value); clearError(); }} autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={loading} required aria-invalid={errorField === 'username' || undefined} aria-describedby={errorField === 'username' ? 'login-error' : undefined} />
          </div>
        </div>
        <div className="auth-field">
          <label htmlFor="login-password">Mật khẩu</label>
          <PasswordInput id="login-password" name="password" placeholder="Nhập mật khẩu" value={password} onChange={(event) => { setPassword(event.target.value); clearError(); }} autoComplete="current-password" disabled={loading} required aria-invalid={errorField === 'password' || undefined} aria-describedby={errorField === 'password' ? 'login-error' : undefined} />
        </div>
        <button type="submit" className="public-button public-button--primary auth-submit" disabled={loading}>
          {loading ? <><span className="public-spinner" aria-hidden="true" />Đang đăng nhập…</> : <>Đăng nhập<PublicIcon name="arrow" /></>}
        </button>
        <p className="auth-session-hint"><PublicIcon name="lock" />Phiên đăng nhập được lưu trên thiết bị này.</p>
      </form>
    </AuthLayout>
  );
}
