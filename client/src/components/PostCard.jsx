import { useEffect, useState } from 'react';
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send, Trash2, Pencil, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { assetUrl } from '../services/api';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { formatDistanceToNow } from '../utils/date';

export default function PostCard({ post: initialPost, onChange, showToast }) {
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [liked, setLiked] = useState(initialPost.likes?.some((id) => String(id?._id || id) === user?._id) || false);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(initialPost.caption || '');
  const [busy, setBusy] = useState(false);
  const own = post.author?._id === user?._id;

  useEffect(() => { setPost(initialPost); setLiked(initialPost.likes?.some((id) => String(id?._id || id) === user?._id) || false); setBookmarked(!!initialPost.isBookmarked); }, [initialPost, user?._id]);

  const toggleLike = async () => {
    const wasLiked = liked; setLiked(!wasLiked); setPost((p) => ({ ...p, likes: Array(Math.max(0, (p.likes?.length || 0) + (wasLiked ? -1 : 1))).fill(null) }));
    try { const { data } = await api.post(`/posts/${post._id}/like`); setLiked(data.liked); setPost((p) => ({ ...p, likes: Array(data.likes).fill(null) })); }
    catch (error) { setLiked(wasLiked); showToast?.(error.response?.data?.message || 'Could not update like.', 'error'); }
  };
  const toggleBookmark = async () => {
    try { const { data } = await api.post(`/users/bookmarks/${post._id}`); setBookmarked(data.bookmarked); showToast?.(data.bookmarked ? 'Saved to your bookmarks.' : 'Removed from bookmarks.'); }
    catch { showToast?.('Could not update bookmark.', 'error'); }
  };
  const openComments = async () => {
    const next = !commentsOpen; setCommentsOpen(next);
    if (next) { try { const { data } = await api.get(`/posts/${post._id}/comments`); setComments(data.comments); } catch {} }
  };
  const submitComment = async (e) => {
    e.preventDefault(); if (!comment.trim()) return;
    setBusy(true);
    try { const { data } = await api.post(`/posts/${post._id}/comments`, { text: comment }); setComments((items) => [...items, data.comment]); setComment(''); setPost((p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 })); }
    catch (error) { showToast?.(error.response?.data?.message || 'Could not add comment.', 'error'); }
    finally { setBusy(false); }
  };
  const removeComment = async (commentId) => {
    try { await api.delete(`/posts/${post._id}/comments/${commentId}`); setComments((items) => items.filter((item) => item._id !== commentId)); setPost((p) => ({ ...p, commentCount: Math.max(0, (p.commentCount || 0) - 1) })); showToast?.('Comment deleted.'); }
    catch (error) { showToast?.(error.response?.data?.message || 'Could not delete comment.', 'error'); }
  };
  const deletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try { await api.delete(`/posts/${post._id}`); onChange?.(post._id); showToast?.('Post deleted.'); }
    catch (error) { showToast?.(error.response?.data?.message || 'Could not delete post.', 'error'); }
  };
  const saveEdit = async () => {
    try { const { data } = await api.patch(`/posts/${post._id}`, { caption }); setPost(data.post); setEditing(false); showToast?.('Post updated.'); }
    catch (error) { showToast?.(error.response?.data?.message || 'Could not update post.', 'error'); }
  };
  const sharePost = async () => {
    const url = `${window.location.origin}/home#post-${post._id}`;
    try { await navigator.clipboard.writeText(url); showToast?.('Post link copied to clipboard.', 'info'); }
    catch { showToast?.(url, 'info'); }
  };

  return <article className="post-card" id={`post-${post._id}`}>
    <div className="post-header"><Link to={`/u/${post.author?.username}`}><Avatar user={post.author} size="md" /></Link><div className="post-author"><Link to={`/u/${post.author?.username}`} className="author-name">{post.author?.fullName || 'Connectify member'}</Link><small>@{post.author?.username} <span>·</span> {formatDistanceToNow(post.createdAt)}</small></div>
      <div className="post-menu-wrap"><button className="icon-button post-more" onClick={() => setMenuOpen((v) => !v)}><MoreHorizontal size={20} /></button>{menuOpen && <div className="dropdown-menu">{own ? <><button onClick={() => { setEditing(true); setMenuOpen(false); }}><Pencil size={14} /> Edit caption</button><button className="danger-text" onClick={deletePost}><Trash2 size={14} /> Delete post</button></> : <button onClick={() => { sharePost(); setMenuOpen(false); }}><Send size={14} /> Share post</button>}</div>}</div>
    </div>
    {editing && <div className="edit-caption"><textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2200} /><div><button className="text-button" onClick={() => setEditing(false)}>Cancel</button><button className="small-primary" onClick={saveEdit}>Save changes</button></div></div>}
    {post.caption && !editing && <p className="post-caption">{post.caption.split(/(#[\w]+|@[\w.]+)/g).map((part, i) => part.startsWith('#') ? <span className="hashtag" key={i}>{part}</span> : part.startsWith('@') ? <span className="mention" key={i}>{part}</span> : part)}</p>}
    {post.imageUrl && <div className="post-image-wrap"><img className="post-image" src={assetUrl(post.imageUrl)} alt={post.imageAlt || 'Shared post'} loading="lazy" /></div>}
    <div className="post-actions"><div className="post-actions-left"><button className={`post-action ${liked ? 'liked' : ''}`} onClick={toggleLike} aria-label={liked ? 'Unlike post' : 'Like post'}><Heart size={20} fill={liked ? 'currentColor' : 'none'} /><span>{post.likes?.length || 0}</span></button><button className="post-action" onClick={openComments}><MessageCircle size={20} /><span>{post.commentCount || comments.length || 0}</span></button><button className="post-action" onClick={sharePost}><Send size={19} /></button></div><button className={`post-action bookmark-action ${bookmarked ? 'saved' : ''}`} onClick={toggleBookmark} aria-label="Save post"><Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} /></button></div>
    {commentsOpen && <section className="comments-panel"><div className="comments-heading"><b>Conversation</b><button onClick={() => setCommentsOpen(false)}><X size={16} /></button></div><div className="comment-list">{comments.map((item) => <div className="comment-row" key={item._id}><Avatar user={item.author} size="xs" /><p><Link to={`/u/${item.author?.username}`}><b>{item.author?.username}</b></Link> {item.text}</p>{(item.author?._id === user?._id || own) && <button className="comment-delete" onClick={() => removeComment(item._id)} title="Delete comment"><Trash2 size={12} /></button>}</div>)}{!comments.length && <p className="empty-hint">Be the first to add a thought.</p>}</div><form className="comment-form" onSubmit={submitComment}><Avatar user={user} size="xs" /><input placeholder="Add to the conversation..." value={comment} onChange={(e) => setComment(e.target.value)} maxLength={700} /><button type="submit" disabled={busy || !comment.trim()}>Post</button></form></section>}
  </article>;
}
