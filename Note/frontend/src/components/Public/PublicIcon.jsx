import Icon from '../UI/Icon';

export default function PublicIcon({ name, className = '' }) {
  return <Icon name={name} className={`public-icon ${className}`} />;
}
