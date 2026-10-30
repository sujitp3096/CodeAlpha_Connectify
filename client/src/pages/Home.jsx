import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Flame, Sparkles } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
import StoryBar from '../components/StoryBar';
import EmptyState from '../components/EmptyState';
import { RightRail } from '../components/AppShell';

export default function Home() {
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const composeRequested = searchParams.get('compose') === '1';

  const greeting = useMemo(() => {
    const hour = new Date().getHours(); return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  }, []);
  const load = async () => {
    try {
      const [feedRes, trendsRes] = await Promise.all([api.get('/posts/feed'), api.get('/posts/trending')]);
      setPosts(feedRes.data.posts); setTrending(trendsRes.data.hashtags.slice(0, 5));
    } catch (error) { showToast(error.response?.data?.message || 'Could not load your feed.', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (composeRequested) { document.querySelector('.composer-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); setSearchParams({}, { replace: true }); } }, [composeRequested, setSearchParams]);

  return <div className="content-layout">
    <section className="feed-column">
      <div className="page-heading feed-heading"><div><div className="section-kicker">YOUR COMMUNITY, IN ONE PLACE</div><h1>{greeting}, {user?.fullName?.split(' ')[0] || 'there'} <span className="heading-spark">✦</span></h1><p>A fresh perspective starts with a connection.</p></div><div className="heading-date"><Sparkles size={16} /><span>Make today meaningful</span></div></div>
      <StoryBar />
      <Composer user={user} onPosted={(post) => setPosts((items) => [post, ...items])} showToast={showToast} />
      <div className="feed-section-heading"><div><h2>Your feed</h2><p>Little moments from your community</p></div><span className="feed-sort-label">RECENTLY SHARED</span></div>
      {loading ? <div className="skeleton-stack">{[1, 2, 3].map((n) => <div className="post-skeleton" key={n}><div className="skeleton-line short" /><div className="skeleton-line medium" /><div className="skeleton-block" /></div>)}</div> : posts.length ? <div className="post-list">{posts.map((post) => <PostCard key={post._id} post={post} onChange={(id) => setPosts((items) => items.filter((p) => p._id !== id))} showToast={showToast} />)}</div> : <EmptyState title="Your feed is ready for a first post" message="Share a thought or follow a few people to get the conversation started." />}
    </section>
    <RightRail><section className="rail-card inspiration-card"><div className="inspiration-label"><Flame size={15} /> THE CONVERSATION</div><h3>What is inspiring people today?</h3><p>Explore an idea, discover a creator, or start a new conversation.</p><div className="trending-list">{trending.map((tag, index) => <div className="trending-row" key={tag.tag}><span className="trend-rank">0{index + 1}</span><span><b>#{tag.tag}</b><small>{tag.posts} {tag.posts === 1 ? 'post' : 'posts'}</small></span></div>)}{!trending.length && <p className="empty-hint">Your community's trending topics will show up here.</p>}</div></section></RightRail>
    <Toast toast={toast} />
  </div>;
}
