import { Link } from 'react-router-dom';
import './PublicPage.css';

export default function PublicBrand({ to = '/login', onClick }) {
  return (
    <Link to={to} onClick={onClick} className="public-brand" aria-label={to === '/login' ? 'HKT — đăng nhập' : 'HKT — sổ tay'}>
      <span className="public-brand-mark" aria-hidden="true">HKT</span>
      <span className="public-brand-name">HKT<span>Sổ tay của bạn</span></span>
    </Link>
  );
}
