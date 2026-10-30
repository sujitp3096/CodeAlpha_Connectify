import { ArrowRight, Heart, Image, MessageCircle, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const features = [
  { icon: Users, title: 'Find your people', text: 'Build a circle around the things you care about and the ideas you love.' },
  { icon: Image, title: 'Share your world', text: 'Give moments, thoughts and creative work a welcoming place to live.' },
  { icon: MessageCircle, title: 'Talk in real time', text: 'Keep meaningful conversations moving with live, personal messaging.' },
];
export default function Landing() {
  const { user } = useAuth();
  return <div className="landing-page">
    <header className="landing-nav"><Link to="/" className="landing-logo"><Logo /></Link><nav><a href="#why-connectify">Why Connectify</a><a href="#community">Community</a></nav><div className="landing-actions"><ThemeToggle compact /><Link className="landing-login" to={user ? '/home' : '/login'}>{user ? 'Open app' : 'Log in'}</Link><Link className="button-primary landing-join" to={user ? '/home' : '/register'}>{user ? 'Go to feed' : 'Join Connectify'} <ArrowRight size={16} /></Link></div></header>
    <main>
      <section className="hero-section"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="hero-content"><div className="eyebrow"><Sparkles size={14} /> A more meaningful social space</div><h1>Good things happen<br />when we <span>connect.</span></h1><p className="hero-copy">A little less noise. A lot more you. Find your people, share what matters, and make room for better conversations.</p><div className="hero-cta"><Link className="button-primary" to={user ? '/home' : '/register'}>Get started <ArrowRight size={17} /></Link><a className="text-link" href="#why-connectify">Explore the experience <span>↓</span></a></div><div className="hero-proof"><div className="proof-avatars"><span>J</span><span>M</span><span>A</span><span>+</span></div><p><b>Your next conversation</b><br />could start right here.</p></div></div><div className="hero-art"><div className="art-backdrop" /><div className="floating-chip chip-top"><span className="chip-icon violet"><Heart size={15} fill="currentColor" /></span><span><b>A little appreciation</b><small>is always in style</small></span></div><div className="mock-post"><div className="mock-post-top"><div className="mock-avatar">S</div><div><b>samira.lee</b><small>Shared a little moment · 2h</small></div><span>•••</span></div><div className="mock-photo"><div className="photo-sun" /><div className="photo-hill hill-a" /><div className="photo-hill hill-b" /><div className="photo-caption">slow mornings<br /><i>&</i> softer skies.</div></div><div className="mock-actions"><Heart size={18} /><MessageCircle size={18} /><span>♡</span></div><p><b>samira.lee</b> A reminder to pause and take it all in. <span>#littlethings</span></p></div><div className="floating-chip chip-bottom"><span className="chip-icon mint"><Zap size={15} /></span><span><b>Good energy</b><small>travels fast here</small></span></div></div></section>
      <section className="value-strip" id="community"><div><b>01</b><span>Real connections</span></div><div><b>02</b><span>Creative expression</span></div><div><b>03</b><span>Conversations that flow</span></div><div><b>04</b><span>Your space, your pace</span></div></section>
      <section className="features-section" id="why-connectify"><div className="section-kicker">MADE FOR THE WAY WE CONNECT</div><div className="features-heading"><h2>More connection.<br /><span>Less complication.</span></h2><p>Everything you need to keep in touch and stay inspired, thoughtfully brought together.</p></div><div className="feature-grid">{features.map(({ icon: Icon, title, text }, i) => <article className="feature-card" key={title}><div className={`feature-icon feature-icon-${i}`}><Icon size={21} /></div><span className="feature-number">0{i + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="closing-banner"><div className="closing-spark"><Sparkles size={24} /></div><div><h2>Your people are out there.</h2><p>Make the first connection today.</p></div><Link className="button-light" to={user ? '/home' : '/register'}>Find your circle <ArrowRight size={17} /></Link></section>
    </main>
    <footer className="landing-footer"><Logo /><span>© 2026 Connectify. Connect. Share. Discover.</span><span><ShieldCheck size={14} /> Built around meaningful connection.</span></footer>
  </div>;
}
