import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Clock3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api, { assetUrl } from '../services/api';
import Avatar from './Avatar';
import Toast from './Toast';
import { useToast } from '../hooks/useToast';

export default function StoryBar() {
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(-1);
  const [activeStory, setActiveStory] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);
  const timer = useRef(null);
  const ownIndex = groups.findIndex((group) => group.author._id === user?._id);
  const currentGroup = groups[activeGroup];
  const currentStory = currentGroup?.stories?.[activeStory];
  const orderedGroups = useMemo(() => [...groups].sort((a, b) => (a.author._id === user?._id ? -1 : b.author._id === user?._id ? 1 : 0)), [groups, user?._id]);

  const load = async () => { try { const { data } = await api.get('/stories'); setGroups(data.stories); } catch {} };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!currentStory || !currentGroup) return;
    setProgress(0);
    api.post(`/stories/${currentStory._id}/view`).catch(() => {});
    const started = Date.now();
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const amount = Math.min(100, ((Date.now() - started) / 6000) * 100);
      setProgress(amount);
      if (amount >= 100) { clearInterval(timer.current); advance(1); }
    }, 80);
    return () => clearInterval(timer.current);
  }, [activeGroup, activeStory, currentStory?._id]);

  const close = () => { clearInterval(timer.current); setActiveGroup(-1); setActiveStory(0); setProgress(0); load(); };
  const advance = (direction) => {
    if (!currentGroup) return;
    const next = activeStory + direction;
    if (next >= 0 && next < currentGroup.stories.length) { setActiveStory(next); return; }
    const nextGroup = activeGroup + direction;
    if (nextGroup >= 0 && nextGroup < groups.length) { setActiveGroup(nextGroup); setActiveStory(direction > 0 ? 0 : groups[nextGroup].stories.length - 1); return; }
    close();
  };
  const openGroup = (group) => { const index = groups.findIndex((item) => item.author._id === group.author._id); setActiveGroup(index); setActiveStory(Math.max(0, group.stories.length - 1)); };
  const uploadStory = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Choose an image file.', 'error');
    if (file.size > 8 * 1024 * 1024) return showToast('Image must be smaller than 8 MB.', 'error');
    const form = new FormData(); form.append('image', file);
    try { await api.post('/stories', form); await load(); showToast('Your story is live for 24 hours.'); }
    catch (error) { showToast(error.response?.data?.message || 'Could not upload story.', 'error'); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  };
  const deleteCurrent = async () => {
    if (!currentStory || currentGroup.author._id !== user?._id) return;
    try { await api.delete(`/stories/${currentStory._id}`); showToast('Story deleted.'); await load(); close(); }
    catch (error) { showToast(error.response?.data?.message || 'Could not delete story.', 'error'); }
  };

  return <>
    <div className="stories-bar"><div className="stories-heading"><span>STORIES</span><small><Clock3 size={12} /> Disappear after 24 hours</small></div><div className="stories-list">
      <button className="story-person own-story" onClick={() => ownIndex >= 0 ? openGroup(groups[ownIndex]) : fileRef.current?.click()}><span className="story-ring own-ring"><Avatar user={user} size="md" /></span><i className="story-add-icon" onClick={(event) => { event.stopPropagation(); fileRef.current?.click(); }}><Plus size={12} /></i><span>{ownIndex >= 0 ? 'Your story' : 'Add story'}</span></button>
      {orderedGroups.filter((group) => group.author._id !== user?._id).map((group) => { const unseen = group.stories.some((story) => !story.viewed); return <button className="story-person" key={group.author._id} onClick={() => openGroup(group)}><span className={`story-ring ${unseen ? 'story-unseen' : 'story-seen'}`}><Avatar user={group.author} size="md" /></span><span>{group.author.fullName.split(' ')[0]}</span></button>; })}
      {!orderedGroups.length && <p className="stories-empty">Share a small moment or explore stories from your circle.</p>}
    </div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={(e) => uploadStory(e.target.files?.[0])} /></div>
    {currentStory && currentGroup && <div className="story-viewer" role="dialog" aria-modal="true" onClick={close}><div className="story-viewer-card" onClick={(e) => e.stopPropagation()}><div className="story-progress">{currentGroup.stories.map((item, index) => <span key={item._id}><i style={{ width: index < activeStory ? '100%' : index === activeStory ? `${progress}%` : '0%' }} /></span>)}</div><header><Avatar user={currentGroup.author} size="sm" /><div><b>{currentGroup.author.fullName}</b><small>{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></div>{currentGroup.author._id === user?._id && <button onClick={deleteCurrent} title="Delete story"><Trash2 size={16} /></button>}<button onClick={close} title="Close story"><X size={19} /></button></header><img className="story-viewer-image" src={assetUrl(currentStory.imageUrl)} alt={currentStory.caption || 'Shared story'} /><button className="story-nav story-prev" onClick={() => advance(-1)}><ChevronLeft size={23} /></button><button className="story-nav story-next" onClick={() => advance(1)}><ChevronRight size={23} /></button>{currentStory.caption && <p className="story-caption">{currentStory.caption}</p>}</div></div>}
    <Toast toast={toast} />
  </>;
}
