import { Link } from 'react-router-dom';
import './Brand.css';

export default function Brand({ to = '/dashboard', onClick }) {
  return (
    <Link to={to} onClick={onClick} className="public-brand" aria-label="HKT — sổ tay">
      <img src="./public/bg.png" alt="" className="public-brand-mark" />
      {/* <span className="public-brand-mark" aria-hidden="true">HKT</span> */}
      <span className="public-brand-name">Note<span>Sổ tay của bạn</span></span>
    </Link>
  );
}
