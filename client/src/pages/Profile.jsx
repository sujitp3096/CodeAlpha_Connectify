import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Camera, Link as LinkIcon, MapPin, MessageCircle, Settings2, Sparkles } from 'lucide-react';
import api, { assetUrl } from '../services/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [canView, setCanView] = useState(true);
  const self = profile?.user?._id === me?._id;
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${username}`); setProfile(data); setFollowing(data.isFollowing); setCanView(data.canViewPosts);
      if (data.canViewPosts) { const result = await api.get(`/users/${data.user._id}/posts`); setPosts(result.data.posts); }
      else setPosts([]);
    } catch (error) { setProfile(null); showToast(error.response?.data?.message || 'Could not load this profile.', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [username]);
  const follow = async () => {
    try { const { data } = await api.post(`/users/${profile.user._id}/follow`); setFollowing(data.following); setProfile((p) => ({ ...p, user: { ...p.user, followers: data.following ? [...p.user.followers, me._id] : p.user.followers.filter((id) => id !== me._id) } })); showToast(data.message); }
    catch (error) { showToast(error.response?.data?.message || 'Could not update follow status.', 'error'); }
  };
  const message = async () => {
    try { const { data } = await api.post('/messages/conversations', { userId: profile.user._id }); navigate(`/messages?conversation=${data.conversation._id}`); }
    catch (error) { showToast(error.response?.data?.message || 'Could not start a conversation.', 'error'); }
  };
  if (loading) return <div className="profile-loading"><div className="skeleton-block" /><div className="skeleton-line medium" /></div>;
  if (!profile) return <div className="profile-not-found"><EmptyState title="We couldn't find this profile" message="The account may have moved or no longer exists." /><Link className="text-link" to="/explore">Explore people</Link></div>;
  const person = profile.user;
  return <div className="profile-page"><div className="profile-topbar"><button className="back-circle" onClick={() => navigate(-1)}><ArrowLeft size={18} /></button><div><b>{person.fullName}</b><small>@{person.username}</small></div></div>
    <section className="profile-hero"><div className="profile-cover">{person.coverImage && <img src={assetUrl(person.coverImage)} alt="Profile cover" />}<div className="cover-glow" />{self && <Link to="/settings" className="cover-edit"><Camera size={15} /> Edit profile</Link>}</div><div className="profile-info"><div className="profile-avatar-large"><Avatar user={person} size="xl" ring /></div><div className="profile-actions">{self ? <Link to="/settings" className="outline-button"><Settings2 size={16} /> Edit profile</Link> : <><button className={following ? 'outline-button following-button' : 'button-primary'} onClick={follow}>{following ? 'Following' : 'Follow'}</button><button className="outline-button icon-only-button" onClick={message}><MessageCircle size={17} /></button></>}</div>
      <div className="profile-name-block"><h1>{person.fullName} {person.isPrivate && <span className="private-tag">PRIVATE</span>}</h1><p>@{person.username}</p></div>{person.bio && <p className="profile-bio">{person.bio}</p>}<div className="profile-meta">{person.location && <span><MapPin size={14} />{person.location}</span>}{person.website && <a href={person.website.startsWith('http') ? person.website : `https://${person.website}`} target="_blank" rel="noreferrer"><LinkIcon size={14} />{person.website.replace(/^https?:\/\//, '')}</a>}<span><CalendarDays size={14} /> Joined {new Date(person.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span></div>
      <div className="profile-stats"><div><b>{profile.postCount || 0}</b><span>Posts</span></div><div><b>{person.followers?.length || 0}</b><span>Followers</span></div><div><b>{person.following?.length || 0}</b><span>Following</span></div></div>
    </div></section>
    <div className="profile-posts-heading"><span><Sparkles size={16} /> {self ? 'Your posts' : `${person.fullName.split(' ')[0]}'s posts`}</span><small>{profile.postCount || 0} shared moments</small></div>
    {!canView ? <EmptyState title="This account is private" message="Follow this account to see their posts and updates." /> : posts.length ? <div className="profile-post-list">{posts.map((post) => <PostCard key={post._id} post={post} onChange={(id) => setPosts((items) => items.filter((p) => p._id !== id))} showToast={showToast} />)}</div> : <EmptyState title={self ? 'Your story starts here' : 'No posts just yet'} message={self ? 'Share your first post and let your community in.' : 'When a post is shared, it will appear here.'} />}
    <Toast toast={toast} />
  </div>;
}
