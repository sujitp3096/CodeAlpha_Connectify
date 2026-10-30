import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Compass, Home, LogOut, Mail, Plus, Search, Settings, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useEffect, useState } from 'react';
import api from '../services/api';
import Avatar from './Avatar';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/home', label: 'Home feed', icon: Home },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/messages', label: 'Messages', icon: Mail, key: 'messages' },
  { to: '/notifications', label: 'Notifications', icon: Bell, key: 'notifications' },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get('/notifications').then(({ data }) => setUnread(data.unreadCount)).catch(() => {});
    const onRead = () => setUnread(0);
    window.addEventListener('connectify:notifications-read', onRead);
    if (!socket) return () => window.removeEventListener('connectify:notifications-read', onRead);
    const onNew = () => setUnread((count) => count + 1);
    socket.on('notification:new', onNew);
    return () => { socket.off('notification:new', onNew); window.removeEventListener('connectify:notifications-read', onRead); };
  }, [socket]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) { setResults([]); return; }
    const timer = setTimeout(() => api.get('/users/search', { params: { q: trimmed } }).then(({ data }) => setResults(data.users)).catch(() => setResults([])), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (to) => { navigate(to); setMobileSearch(false); setQuery(''); setResults([]); };
  const signOut = () => { logout(); navigate('/'); };
  const notificationsPath = '/notifications';

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="sidebar-logo" onClick={() => navigate('/home')}><Logo /></button>
      <div className="sidebar-label">MENU</div>
      <nav className="side-nav">
        {navItems.map(({ to, label, icon: Icon, key }) => <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <span className="nav-icon"><Icon size={19} /></span><span>{label}</span>{key === 'notifications' && unread > 0 && <b className="nav-badge">{unread > 9 ? '9+' : unread}</b>}
        </NavLink>)}
      </nav>
      <button className="new-post-button" onClick={() => navigate('/home?compose=1')}><Plus size={18} /> Create post</button>
      <div className="sidebar-bottom">
        <NavLink to={`/u/${user?.username}`} className={({ isActive }) => `profile-nav ${isActive ? 'active' : ''}`}><Avatar user={user} size="sm" /><span className="profile-nav-copy"><b>{user?.fullName}</b><small>@{user?.username}</small></span><span className="more-dots">···</span></NavLink>
        <div className="sidebar-utility"><ThemeToggle compact /><button className="icon-button" onClick={signOut} title="Log out"><LogOut size={17} /></button></div>
      </div>
    </aside>

    <header className="mobile-header">
      <button onClick={() => navigate('/home')} className="mobile-logo"><Logo /></button>
      <div className="mobile-header-actions"><button className="icon-button" onClick={() => setMobileSearch((v) => !v)}><Search size={19} /></button><button className="icon-button notification-action" onClick={() => navigate(notificationsPath)}><Bell size={19} />{unread > 0 && <i />}</button><ThemeToggle compact /></div>
    </header>

    {mobileSearch && <div className="mobile-search-panel"><div className="searchbox"><Search size={16} /><input autoFocus placeholder="Search people..." value={query} onChange={(e) => setQuery(e.target.value)} /><button onClick={() => setMobileSearch(false)}><X size={16} /></button></div>{results.map((person) => <button className="search-result" key={person._id} onClick={() => navigateTo(`/u/${person.username}`)}><Avatar user={person} size="sm" /><span><b>{person.fullName}</b><small>@{person.username}</small></span></button>)}</div>}

    <main className="main-area"><Outlet /></main>
    <nav className="mobile-bottom-nav">
      <NavLink to="/home"><Home size={21} /></NavLink><NavLink to="/explore"><Compass size={21} /></NavLink><NavLink to="/messages"><Mail size={21} /></NavLink><NavLink to="/notifications" className="mobile-bell"><Bell size={21} />{unread > 0 && <i />}</NavLink><NavLink to={`/u/${user?.username}`}><UserRound size={21} /></NavLink>
    </nav>
  </div>;
}

export function RightRail({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  useEffect(() => { api.get('/users/suggested').then(({ data }) => setSuggestions(data.users.slice(0, 4))).catch(() => {}); }, []);
  useEffect(() => {
    const q = search.trim();
    if (!q) { setSearchResults([]); return; }
    const timer = setTimeout(() => api.get('/users/search', { params: { q } }).then(({ data }) => setSearchResults(data.users)).catch(() => setSearchResults([])), 250);
    return () => clearTimeout(timer);
  }, [search]);
  return <aside className="right-rail">
    <div className="rail-search-wrap"><div className="rail-search"><Search size={16} /><input placeholder="Find your people" value={search} onChange={(e) => setSearch(e.target.value)} /></div>{search.trim() && <div className="rail-search-results">{searchResults.map((person) => <button key={person._id} onClick={() => { navigate(`/u/${person.username}`); setSearch(''); }}><Avatar user={person} size="xs" /><span><b>{person.fullName}</b><small>@{person.username}</small></span></button>)}{!searchResults.length && <p>No people found.</p>}</div>}</div>
    {children}
    <section className="rail-card suggestions-card">
      <div className="rail-card-heading"><h3>People to know</h3><span>For you</span></div>
      {suggestions.map((person) => <div className="suggestion-row" key={person._id}><Avatar user={person} size="sm" /><div className="suggestion-copy"><b>{person.fullName}</b><small>@{person.username}</small></div><button className="mini-follow" onClick={async (e) => { try { await api.post(`/users/${person._id}/follow`); e.currentTarget.textContent = 'Following'; e.currentTarget.disabled = true; } catch {} }}>Follow</button></div>)}
      {!suggestions.length && <p className="empty-hint">More connections will appear here.</p>}
    </section>
    <div className="rail-footer">About · Guidelines · Privacy<br />© 2026 Connectify Social</div>
  </aside>;
}
