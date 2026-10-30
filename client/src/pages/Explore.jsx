import { useEffect, useState } from 'react';
import { Search, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('posts');
  const { toast, showToast } = useToast();
  useEffect(() => { Promise.all([api.get('/posts/explore'), api.get('/posts/trending'), api.get('/users/suggested')]).then(([p, t, c]) => { setPosts(p.data.posts); setTrending(t.data.hashtags); setCreators(c.data.users.slice(0, 4)); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    const q = query.trim(); if (!q) { setUsers([]); return; }
    const timer = setTimeout(() => api.get('/users/search', { params: { q } }).then(({ data }) => setUsers(data.users)).catch(() => setUsers([])), 280);
    return () => clearTimeout(timer);
  }, [query]);
  const pickTag = (tag) => { setQuery(`#${tag}`); setTab('posts'); };
  return <div className="explore-page">
    <div className="page-heading explore-heading"><div><div className="section-kicker">FRESH IDEAS & NEW CONNECTIONS</div><h1>Explore <span className="heading-spark">✦</span></h1><p>Find inspiration beyond your feed.</p></div></div>
    <div className="explore-search"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, creators, ideas..." /></div>
    {query.trim() && <section className="search-results-section"><div className="feed-section-heading"><div><h2>People</h2><p>Profiles matching “{query}”</p></div></div>{users.length ? users.map((person) => <Link to={`/u/${person.username}`} className="explore-user-row" key={person._id}><Avatar user={person} size="md" /><div><b>{person.fullName}</b><small>@{person.username}</small></div><ArrowUpRight size={16} /></Link>) : <p className="empty-hint">No people found for this search.</p>}</section>}
    <div className="explore-main-grid"><section className="explore-content"><div className="explore-tabs"><button className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Discover posts</button><button className={tab === 'people' ? 'active' : ''} onClick={() => setTab('people')}>People</button></div>
      {tab === 'posts' && (loading ? <div className="skeleton-block explore-skeleton" /> : posts.length ? <div className="explore-post-list">{posts.filter((p) => !query.startsWith('#') || p.hashtags?.includes(query.slice(1).toLowerCase())).map((post) => <PostCard key={post._id} post={post} onChange={(id) => setPosts((items) => items.filter((p) => p._id !== id))} showToast={showToast} />)}</div> : <EmptyState title="Nothing to explore yet" message="Create the first post and give your community something to discover." />)}
      {tab === 'people' && <div className="people-discovery">{users.length ? users.map((person) => <Link to={`/u/${person.username}`} className="person-discovery-card" key={person._id}><Avatar user={person} size="lg" /><b>{person.fullName}</b><small>@{person.username}</small><span>View profile <ArrowUpRight size={13} /></span></Link>) : <EmptyState icon={Users} title="Search for your people" message="Use the search field above to find people by name or username." />}</div>}
    </section><aside className="explore-side"><div className="rail-card"><div className="inspiration-label"><TrendingUp size={15} /> TRENDING TOPICS</div><h3>Conversations worth joining</h3>{trending.map((item, i) => <button className="explore-trend" key={item.tag} onClick={() => pickTag(item.tag)}><span className="trend-rank">0{i + 1}</span><span><b>#{item.tag}</b><small>{item.posts} posts</small></span><ArrowUpRight size={15} /></button>)}{!trending.length && <p className="empty-hint">Hashtags will appear as people start sharing.</p>}</div><div className="creator-card"><div className="creator-card-heading"><h3>Creators to know</h3><span>Suggested</span></div>{creators.map((person) => <Link to={`/u/${person.username}`} className="creator-mini-row" key={person._id}><Avatar user={person} size="sm" /><span><b>{person.fullName}</b><small>@{person.username}</small></span><ArrowUpRight size={14} /></Link>)}{!creators.length && <p className="empty-hint">New creators will show up here.</p>}</div><div className="explore-note"><span>✦</span><p>Good connections often begin with a curious click.</p></div></aside></div><Toast toast={toast} />
  </div>;
}
