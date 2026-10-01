import { useState } from 'react';
import PublicIcon from './PublicIcon';

export default function PasswordInput({ id, label = 'mật khẩu', ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-input-wrap auth-input-wrap--password">
      <PublicIcon name="lock" className="auth-input-icon" />
      <input {...inputProps} id={id} type={visible ? 'text' : 'password'} />
      <button type="button" className="auth-password-toggle" aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${label}`} aria-pressed={visible} aria-controls={id} disabled={inputProps.disabled} onClick={() => setVisible((current) => !current)}>
        <PublicIcon name={visible ? 'eye-off' : 'eye'} />
      </button>
    </div>
  );
}
