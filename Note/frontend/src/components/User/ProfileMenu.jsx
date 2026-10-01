import { useContext, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContextBase';
import useAuth from '../../hooks/useAuth';
import Icon from '../UI/Icon';
import './ProfileMenu.css';

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { preferences } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const container = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  const name = user?.displayName || user?.username || 'Người dùng';
  const avatar = user?.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : name.slice(0, 1).toLocaleUpperCase('vi');
  const avatarStyle = { backgroundColor: preferences?.primaryColor || '#2463eb' };

  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!container.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  const openSettings = (tab) => { setOpen(false); navigate(`/settings?tab=${tab}`); };
  return <div className="profile-menu-container" ref={container} onBlur={(event) => { if (event.relatedTarget && !container.current?.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="profile-trigger-btn" type="button" onClick={() => setOpen((current) => !current)} aria-label="Menu tài khoản" aria-expanded={open} aria-controls={id}>
      <span className="avatar-circle" style={avatarStyle}>{avatar}</span><span className="profile-name">{name}</span><Icon name="chevron-down" size={15} className={`arrow-icon ${open ? 'open' : ''}`} />
    </button>
    {open && <div className="profile-dropdown" id={id}>
      <div className="dropdown-user-info"><span className="dropdown-avatar" style={avatarStyle}>{avatar}</span><div className="dropdown-user-copy"><p className="user-info-name">{name}</p><p className="user-info-email">{user?.email || `@${user?.username || ''}`}</p></div></div>
      <hr className="dropdown-divider" />
      <ul className="dropdown-menu-list">{[['profile', 'user', 'Hồ sơ cá nhân'], ['appearance', 'palette', 'Giao diện và hiển thị'], ['security', 'shield', 'Mật khẩu và bảo mật']].map(([tab, icon, label]) => <li key={tab}><button type="button" className="dropdown-item" onClick={() => openSettings(tab)}><Icon name={icon} size={18} className="item-icon" /><span>{label}</span></button></li>)}</ul>
      <hr className="dropdown-divider" />
      <div className="dropdown-footer"><button type="button" className="dropdown-item logout-item" onClick={() => { setOpen(false); logout(); navigate('/login'); }}><Icon name="logout" size={18} className="item-icon" /><span>Đăng xuất</span></button></div>
    </div>}
  </div>;
};
export default ProfileMenu;
