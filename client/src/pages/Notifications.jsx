import { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Mail, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { formatDistanceToNow } from '../utils/date';

const notificationCopy = {
  like: ['liked your post', Heart],
  comment: ['commented on your post', MessageCircle],
  follow: ['started following you', UserPlus],
  mention: ['mentioned you in a post or comment', AtSign],
  message: ['sent you a message', Mail],
};
export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/notifications').then(({ data }) => setItems(data.notifications)).catch(() => {}).finally(() => setLoading(false));
    api.patch('/notifications/read').then(() => { setItems((current) => current.map((item) => ({ ...item, isRead: true }))); window.dispatchEvent(new Event('connectify:notifications-read')); }).catch(() => {});
  }, []);
  return <div className="notifications-page"><div className="page-heading"><div><div className="section-kicker">A LITTLE SOMETHING TO SMILE ABOUT</div><h1>Notifications</h1><p>Stay close to the moments happening around you.</p></div><span className="heading-icon"><Bell size={19} /></span></div>
    {loading ? <div className="skeleton-stack">{[1, 2, 3].map((n) => <div className="post-skeleton" key={n}><div className="skeleton-line short" /><div className="skeleton-line medium" /></div>)}</div> : items.length ? <div className="notification-list"><div className="notification-list-top"><span>RECENT ACTIVITY</span><small><CheckCheck size={14} /> All caught up</small></div>{items.map((item) => { const [copy, Icon] = notificationCopy[item.type] || ['interacted with you', Bell]; return <div className={`notification-row ${item.isRead ? '' : 'unread'}`} key={item._id}><div className="notification-avatar"><Avatar user={item.actor} size="md" /><span className={`notification-type notification-${item.type}`}><Icon size={11} /></span></div><div className="notification-copy"><p><Link to={`/u/${item.actor?.username}`}><b>{item.actor?.fullName || 'Someone'}</b></Link> {copy}{item.message && item.type === 'comment' ? <em> “{item.message}”</em> : null}</p><small>{formatDistanceToNow(item.createdAt)}</small></div>{item.post?.imageUrl && <img className="notification-thumb" src={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${item.post.imageUrl}`} alt="Post thumbnail" />}</div>; })}</div> : <EmptyState icon={Bell} title="Your notifications will show up here" message="Likes, comments and new followers will find their way here." />}
  </div>;
}
