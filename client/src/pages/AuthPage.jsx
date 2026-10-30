import { useState } from 'react';
import { Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', identifier: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const update = (key) => (e) => setForm((v) => ({ ...v, [key]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isRegister) {
        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value));
        if (avatarFile) payload.append('avatar', avatarFile);
        await signIn(payload, 'register');
      } else await signIn({ identifier: form.identifier, password: form.password, rememberMe }, 'login');
      navigate('/home');
    }
    catch (err) { setError(err.response?.data?.message || 'We could not sign you in. Please try again.'); }
    finally { setLoading(false); }
  };
  return <div className="auth-page"><header className="auth-top"><Link to="/"><Logo /></Link><div><span>{isRegister ? 'Already part of the circle?' : 'New to Connectify?'}</span><Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Create account'}</Link><ThemeToggle compact /></div></header>
    <div className="auth-layout"><section className="auth-promo"><div className="auth-promo-shape" /><div className="eyebrow"><Sparkles size={14} /> YOUR SPACE TO CONNECT</div><h1>{isRegister ? <>Start with a hello.<br /><span>Stay for the people.</span></> : <>Welcome back<br /><span>to your circle.</span></>}</h1><p>{isRegister ? 'Create your corner of Connectify and find conversations worth coming back to.' : 'Your people, your moments, your conversations. Pick up right where you left off.'}</p><div className="promo-note"><div className="promo-note-icon"><ShieldCheck size={19} /></div><span><b>Your account, your space</b><small>Thoughtful controls keep you in charge of your experience.</small></span></div><div className="auth-scribble">connect · share · discover</div></section>
      <section className="auth-form-wrap"><div className="auth-form-card"><Link to="/" className="back-home"><ArrowLeft size={15} /> Back to home</Link><div className="auth-title"><h2>{isRegister ? 'Create your account' : 'Good to see you again'}</h2><p>{isRegister ? 'A few details and you are on your way.' : 'Enter your details to continue.'}</p></div>
        <form onSubmit={submit} className="auth-form">
          {isRegister && <><label>Full name<input value={form.fullName} onChange={update('fullName')} placeholder="Your name" autoComplete="name" maxLength={70} required /></label><label>Username<div className="input-prefix"><span>@</span><input value={form.username} onChange={update('username')} placeholder="choose-a-username" autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_.]+" required /></div></label><label>Email address<input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" required /></label><div className="auth-photo-field"><span>Profile photo <small>(optional)</small></span><div><button type="button" onClick={() => document.getElementById('register-avatar-input')?.click()}>{avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <span className="auth-photo-placeholder">+</span>}<b>{avatarFile ? 'Change photo' : 'Add a photo'}</b></button><input id="register-avatar-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) { if (file.size > 8 * 1024 * 1024) { setError('Profile photo must be smaller than 8 MB.'); return; } setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); } }} /></div></div></>}
          {!isRegister && <label>Email or username<input value={form.identifier} onChange={update('identifier')} placeholder="Enter email or username" autoComplete="username" required /></label>}
          <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={update('password')} placeholder="At least 8 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label="Show or hide password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {isRegister && <label>Confirm password<input type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Enter your password again" autoComplete="new-password" minLength={8} required /></label>}
          {!isRegister && <div className="auth-extra"><label className="remember-option"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} /> <span>Remember me</span></label><span className="muted-small">Secure sign-in</span></div>}
          {error && <div className="form-error">{error}</div>}
          <button className="auth-submit" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
        </form><div className="auth-switch">{isRegister ? 'Already have an account?' : 'New around here?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></div><div className="auth-security"><ShieldCheck size={14} /> Your password is securely encrypted.</div></div></section></div><Toast toast={toast} />
  </div>;
}
