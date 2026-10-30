import { assetUrl } from '../services/api';
const colors = ['#8B7AF8', '#EF9B83', '#5CA89B', '#D68CB7', '#6D91CB'];
export default function Avatar({ user, size = 'md', ring = false, online = false }) {
  const name = user?.fullName || user?.username || 'Connectify member';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const color = colors[(name.charCodeAt(0) || 0) % colors.length];
  return <span className={`avatar avatar-${size} ${ring ? 'avatar-ring' : ''} ${online ? 'avatar-online' : ''}`}>
    {user?.avatar ? <img src={assetUrl(user.avatar)} alt={`${name}'s avatar`} /> : <span style={{ background: color }}>{initial}</span>}
    {online && <i />}
  </span>;
}
