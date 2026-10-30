import { useRef, useState } from 'react';
import { ImagePlus, Smile, X, Send } from 'lucide-react';
import Avatar from './Avatar';
import api from '../services/api';

export default function Composer({ user, onPosted, showToast }) {
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const chooseImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast?.('Choose an image file.', 'error');
    if (file.size > 8 * 1024 * 1024) return showToast?.('Image must be smaller than 8 MB.', 'error');
    setImage(file); setPreview(URL.createObjectURL(file));
  };
  const publish = async (e) => {
    e.preventDefault(); if (!caption.trim() && !image) return;
    setBusy(true);
    try {
      const form = new FormData(); form.append('caption', caption); if (image) form.append('image', image);
      const { data } = await api.post('/posts', form);
      setCaption(''); setImage(null); setPreview(''); if (fileRef.current) fileRef.current.value = '';
      onPosted?.(data.post); showToast?.('Your post is live.');
    } catch (error) { showToast?.(error.response?.data?.message || 'Could not publish your post.', 'error'); }
    finally { setBusy(false); }
  };
  return <form className="composer-card" onSubmit={publish}>
    <div className="composer-top"><Avatar user={user} size="md" /><textarea placeholder="What would you like to share today?" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} rows={2} /></div>
    {preview && <div className="composer-preview"><img src={preview} alt="Selected upload preview" /><button type="button" onClick={() => { setImage(null); setPreview(''); }}><X size={16} /></button></div>}
    <div className="composer-bottom"><div className="composer-tools"><button type="button" className="composer-tool" onClick={() => fileRef.current?.click()}><ImagePlus size={17} /><span>Photo</span></button><button type="button" className="composer-tool" onClick={() => setCaption((v) => `${v}${v && !v.endsWith(' ') ? ' ' : ''}✨`)}><Smile size={17} /><span>Feeling</span></button><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => chooseImage(e.target.files?.[0])} /></div><span className="char-count">{caption.length}/2200</span><button className="publish-button" type="submit" disabled={busy || (!caption.trim() && !image)}>{busy ? 'Sharing…' : 'Share post'} <Send size={15} /></button></div>
  </form>;
}
