import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Eye, EyeOff, LockKeyhole, LogOut, Moon, Shield, Sun, UserRound, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { assetUrl } from '../services/api';
import api from '../services/api';
import Avatar from '../components/Avatar';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const fileRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const coverRef = useRef(null);
  const [profile, setProfile] = useState({ fullName: '', bio: '', location: '', website: '', isPrivate: false });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => { if (user) setProfile({ fullName: user.fullName || '', bio: user.bio || '', location: user.location || '', website: user.website || '', isPrivate: !!user.isPrivate }); }, [user]);
  const update = (key) => (e) => setProfile((p) => ({ ...p, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const form = new FormData(); Object.entries(profile).forEach(([key, value]) => form.append(key, value)); if (avatarFile) form.append('avatar', avatarFile); if (coverFile) form.append('coverImage', coverFile);
      await api.patch('/users/me', form); await refreshUser(); setAvatarFile(null); setAvatarPreview(''); setCoverFile(null); setCoverPreview(''); showToast('Your profile has been saved.');
    } catch (error) { showToast(error.response?.data?.message || 'Could not save your profile.', 'error'); }
    finally { setSaving(false); }
  };
  const changePassword = async (e) => {
    e.preventDefault();
    try { const { data } = await api.patch('/auth/password', password); setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' }); showToast(data.message); }
    catch (error) { showToast(error.response?.data?.message || 'Could not change password.', 'error'); }
  };
  const signOut = () => { logout(); navigate('/'); };
  return <div className="settings-page"><div className="page-heading"><div><div className="section-kicker">MAKE IT FEEL LIKE YOUR SPACE</div><h1>Settings</h1><p>Personalise your experience and manage your account.</p></div><span className="heading-icon"><Settings2 size={19} /></span></div>
    <div className="settings-grid"><aside className="settings-menu"><a href="#profile" className="active"><UserRound size={17} /> Profile</a><a href="#appearance"><Sun size={17} /> Appearance</a><a href="#privacy"><Shield size={17} /> Privacy</a><a href="#security"><LockKeyhole size={17} /> Security</a></aside>
      <div className="settings-content"><section className="settings-card" id="profile"><div className="settings-card-head"><div><h2>Personal details</h2><p>Tell people a little more about you.</p></div><span className="settings-section-icon"><UserRound size={18} /></span></div><form onSubmit={saveProfile}><div className="avatar-edit-row"><div className="avatar-edit-preview">{avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : user?.avatar ? <img src={assetUrl(user.avatar)} alt="Profile avatar" /> : <Avatar user={user} size="xl" />}</div><div><b>Profile photo</b><p>JPG, PNG, WEBP or GIF. Max 8 MB.</p><button className="outline-button" type="button" onClick={() => fileRef.current?.click()}><Camera size={15} /> Change photo</button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); } }} /></div></div><div className="cover-edit-row"><div className="cover-edit-preview">{coverPreview ? <img src={coverPreview} alt="Cover preview" /> : user?.coverImage ? <img src={assetUrl(user.coverImage)} alt="Current cover" /> : <span>CONNECTIFY · YOUR SPACE</span>}</div><div><b>Profile cover</b><p>A wide image for the top of your profile. Max 8 MB.</p><button className="outline-button" type="button" onClick={() => coverRef.current?.click()}><Camera size={15} /> Change cover</button><input ref={coverRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => { const file = e.target.files?.[0]; if (file) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)); } }} /></div></div><div className="settings-form-grid"><label>Full name<input value={profile.fullName} onChange={update('fullName')} maxLength={70} required /></label><label>Username<input value={`@${user?.username || ''}`} disabled /></label><label>Email address<input value={user?.email || ''} disabled /></label><label>Location<input value={profile.location} onChange={update('location')} placeholder="City, country" maxLength={60} /></label><label className="span-two">Website<input value={profile.website} onChange={update('website')} placeholder="yourwebsite.com" maxLength={120} /></label><label className="span-two">Bio<textarea value={profile.bio} onChange={update('bio')} placeholder="A little about what makes you, you..." maxLength={180} rows={3} /><small>{profile.bio.length}/180 characters</small></label></div><div className="settings-form-footer"><span>Your changes are visible on your profile.</span><button className="button-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'} <Check size={15} /></button></div></form></section>
        <section className="settings-card" id="appearance"><div className="settings-card-head"><div><h2>Appearance</h2><p>Choose the look that feels right.</p></div><span className="settings-section-icon"><Sun size={18} /></span></div><div className="theme-options"><button className={`theme-option ${theme === 'light' ? 'selected' : ''}`} onClick={() => setTheme('light')}><span className="theme-preview preview-light"><i /><i /><i /></span><span><b><Sun size={15} /> Light mode</b><small>Soft, clear and bright</small></span>{theme === 'light' && <Check size={16} />}</button><button className={`theme-option ${theme === 'dark' ? 'selected' : ''}`} onClick={() => setTheme('dark')}><span className="theme-preview preview-dark"><i /><i /><i /></span><span><b><Moon size={15} /> Dark mode</b><small>Easy on the eyes</small></span>{theme === 'dark' && <Check size={16} />}</button></div></section>
        <section className="settings-card" id="privacy"><div className="settings-card-head"><div><h2>Privacy</h2><p>Choose who can see your shared moments.</p></div><span className="settings-section-icon"><Shield size={18} /></span></div><label className="privacy-setting"><span><b>Private account</b><small>Only followers can see your posts. People can still find your profile.</small></span><input type="checkbox" checked={profile.isPrivate} onChange={update('isPrivate')} /><i /></label><div className="privacy-save-row"><span>Remember to save your profile changes above.</span><button className="text-button" onClick={saveProfile}>Save privacy setting</button></div></section>
        <section className="settings-card" id="security"><div className="settings-card-head"><div><h2>Change password</h2><p>Use a unique password you do not use elsewhere.</p></div><span className="settings-section-icon"><LockKeyhole size={18} /></span></div><form onSubmit={changePassword} className="password-settings-form"><label>Current password<input type="password" value={password.currentPassword} onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))} required /></label><label>New password<div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password.newPassword} onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))} minLength={8} required /><button type="button" onClick={() => setShowPassword((v) => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><label>Confirm new password<input type="password" value={password.confirmPassword} onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))} minLength={8} required /></label><button className="button-primary" type="submit">Update password</button></form></section>
        <section className="settings-card logout-card"><div><h3>Ready to step away?</h3><p>You can come back to your community any time.</p></div><button className="logout-button" onClick={signOut}><LogOut size={16} /> Log out</button></section>
      </div></div><Toast toast={toast} />
  </div>;
}
