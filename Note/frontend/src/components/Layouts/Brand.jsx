import { Link } from 'react-router-dom';
import './Brand.css';

export default function Brand({ to = '/dashboard', onClick }) {
  return (
    <Link to={to} onClick={onClick} className="public-brand" aria-label="HKT — sổ tay">
      <span className="public-brand-mark" aria-hidden="true">HKT</span>
      <span className="public-brand-name">HKT<span>Sổ tay của bạn</span></span>
    </Link>
  );
}
