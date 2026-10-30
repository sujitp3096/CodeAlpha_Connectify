import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck, MessageCircle, Plus, Search, Send, Smile, Sparkles } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import { formatDistanceToNow } from '../utils/date';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

export default function Messages() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(searchParams.get('conversation') || '');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const { toast, showToast } = useToast();
  const active = conversations.find((c) => c._id === activeId);
  const other = active?.participants?.find((person) => person._id !== user?._id);
  const isOnline = other && onlineUsers.includes(other._id);

  const loadConversations = async () => {
    try { const { data } = await api.get('/messages/conversations'); setConversations(data.conversations); }
    catch { showToast('Could not load your conversations.', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { const id = searchParams.get('conversation'); if (id) setActiveId(id); }, [searchParams]);
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let alive = true;
    api.get(`/messages/${activeId}`).then(({ data }) => { if (alive) setMessages(data.messages); }).catch((error) => { if (alive) showToast(error.response?.data?.message || 'Could not load messages.', 'error'); });
    socket?.emit('conversation:join', activeId);
    return () => { alive = false; };
  }, [activeId, socket]);
  useEffect(() => {
    if (!socket) return;
    const onMessage = ({ message, conversationId }) => {
      if (conversationId === activeId) setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
      loadConversations();
    };
    const onTyping = ({ conversationId, userId, typing: activeTyping }) => { if (conversationId === activeId && userId !== user?._id) setTyping(activeTyping); };
    const onRead = ({ conversationId, readerId }) => { if (conversationId === activeId) setMessages((items) => items.map((item) => item.sender?._id === user?._id ? { ...item, readBy: [...(item.readBy || []), readerId] } : item)); };
    const onReaction = ({ conversationId, messageId, reactions }) => { if (conversationId === activeId) setMessages((items) => items.map((item) => item._id === messageId ? { ...item, reactions } : item)); };
    socket.on('message:new', onMessage); socket.on('typing:update', onTyping); socket.on('messages:read', onRead); socket.on('message:reaction', onReaction);
    return () => { socket.off('message:new', onMessage); socket.off('typing:update', onTyping); socket.off('messages:read', onRead); socket.off('message:reaction', onReaction); };
  }, [socket, activeId, user?._id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);
  useEffect(() => {
    const q = search.trim(); if (!q) { setResults([]); return; }
    const timer = setTimeout(() => api.get('/users/search', { params: { q } }).then(({ data }) => setResults(data.users)).catch(() => setResults([])), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const selectConversation = (id) => { setActiveId(id); setSearchParams({ conversation: id }); setSearch(''); setResults([]); };
  const startConversation = async (person) => {
    try { const { data } = await api.post('/messages/conversations', { userId: person._id }); await loadConversations(); selectConversation(data.conversation._id); }
    catch (error) { showToast(error.response?.data?.message || 'Could not open conversation.', 'error'); }
  };
  const send = async (e) => {
    e.preventDefault(); if (!text.trim() || !activeId || sending) return;
    const content = text.trim(); setText(''); setSending(true); socket?.emit('typing:stop', { conversationId: activeId });
    try { const { data } = await api.post(`/messages/${activeId}`, { text: content }); setMessages((items) => items.some((item) => item._id === data.message._id) ? items : [...items, data.message]); loadConversations(); }
    catch (error) { setText(content); showToast(error.response?.data?.message || 'Message could not be sent.', 'error'); }
    finally { setSending(false); }
  };
  const onTyping = (value) => {
    setText(value); if (!activeId || !socket) return;
    socket.emit('typing:start', { conversationId: activeId }); clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit('typing:stop', { conversationId: activeId }), 1100);
  };
  const reactToMessage = async (message) => {
    try { const { data } = await api.patch(`/messages/${message._id}/reaction`, { emoji: '❤️' }); setMessages((items) => items.map((item) => item._id === message._id ? { ...item, reactions: data.reactions } : item)); }
    catch (error) { showToast(error.response?.data?.message || 'Could not add reaction.', 'error'); }
  };
  const grouped = useMemo(() => messages.map((message, index) => ({ ...message, showDate: index === 0 || new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString() })), [messages]);
  return <div className="messages-page"><div className="messages-title"><div><div className="section-kicker">THE BEST THINGS START WITH A HELLO</div><h1>Messages</h1></div><span className="messages-title-icon"><MessageCircle size={19} /></span></div>
    <div className="messenger-shell"><aside className={`conversation-panel ${activeId ? 'conversation-panel-hidden-mobile' : ''}`}><div className="conversation-panel-head"><div><h2>Your conversations</h2><small>Keep the connection going</small></div><button className="icon-button" title="Start a new conversation" onClick={() => document.querySelector(".conversation-search input")?.focus()}><Plus size={18} /></button></div><div className="conversation-search"><Search size={16} /><input placeholder="Search or start a chat" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {results.length > 0 && <div className="new-chat-results">{results.map((person) => <button key={person._id} onClick={() => startConversation(person)}><Avatar user={person} size="sm" /><span><b>{person.fullName}</b><small>@{person.username}</small></span><span className="new-chat-label">Message</span></button>)}</div>}
      <div className="conversation-list">{loading ? <div className="conversation-loading">{[1, 2, 3].map((n) => <div className="skeleton-line medium" key={n} />)}</div> : conversations.map((conversation) => {
        const person = conversation.participants.find((p) => p._id !== user?._id); const online = onlineUsers.includes(person?._id); const preview = conversation.lastMessage?.text || 'Start the conversation';
        return <button className={`conversation-item ${activeId === conversation._id ? 'active' : ''}`} key={conversation._id} onClick={() => selectConversation(conversation._id)}><Avatar user={person} size="md" online={online} /><span className="conversation-item-copy"><b>{person?.fullName || 'Connectify member'}</b><small>{preview}</small></span><span className="conversation-item-meta"><small>{conversation.updatedAt ? formatDistanceToNow(conversation.updatedAt) : ''}</small></span></button>;
      })}{!loading && !conversations.length && !results.length && <div className="conversation-empty"><MessageCircle size={22} /><b>No conversations yet</b><small>Search for someone to say hello.</small></div>}</div><div className="conversation-panel-foot"><Sparkles size={14} /> A little hello goes a long way.</div></aside>
      <section className={`chat-panel ${!activeId ? 'chat-panel-empty' : ''}`}>
        {active && other ? <><header className="chat-header"><button className="chat-back-mobile" onClick={() => { setActiveId(''); setSearchParams({}); }}><ArrowLeft size={18} /></button><Avatar user={other} size="md" online={!!isOnline} /><div className="chat-header-copy"><b>{other.fullName}</b><small><span className={isOnline ? 'status-dot online' : 'status-dot'} />{isOnline ? 'Active now' : 'Offline'}</small></div></header>
          <div className="chat-messages"><div className="chat-welcome"><Avatar user={other} size="lg" /><b>{other.fullName}</b><span>@{other.username}</span><small>This is the beginning of your conversation.</small></div>{grouped.map((message) => { const mine = message.sender?._id === user?._id; const seen = mine && message.readBy?.some((id) => String(id?._id || id) !== user?._id); return <div key={message._id}>{message.showDate && <div className="chat-date-divider"><span>{new Date(message.createdAt).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>}<div className={`message-line ${mine ? 'mine' : ''}`}>{!mine && <Avatar user={message.sender} size="xs" />}<div className="message-bubble-wrap"><div className="message-bubble">{message.text}</div>{message.reactions?.length > 0 && <div className="message-reactions">{['❤️', '😂', '👍', '✨', '😮'].filter((emoji) => message.reactions.some((reaction) => reaction.emoji === emoji)).map((emoji) => <span key={emoji}>{emoji} {message.reactions.filter((reaction) => reaction.emoji === emoji).length}</span>)}</div>}<div className="message-meta-row"><button className="message-react-button" onClick={() => reactToMessage(message)} title="React with a heart">♥</button><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{mine && <span className="read-receipt">{seen ? <CheckCheck size={12} /> : <Check size={12} />}</span>}</small></div></div></div></div>; })}{typing && <div className="typing-indicator"><span /><span /><span /> <small>{other.fullName.split(' ')[0]} is typing</small></div>}<div ref={bottomRef} /></div>
          <form className="chat-composer" onSubmit={send}><button type="button" className="chat-emoji" onClick={() => setText((v) => `${v} 😊`)}><Smile size={19} /></button><input placeholder="Write a message..." value={text} onChange={(e) => onTyping(e.target.value)} /><button type="submit" className="chat-send" disabled={!text.trim() || sending}><Send size={17} /></button></form></> : <div className="chat-empty-content"><span className="chat-empty-art"><MessageCircle size={31} /></span><h2>Your next great conversation starts here.</h2><p>Choose someone from your conversations or search for a person to send a message.</p><div className="chat-empty-hint"><Sparkles size={15} /> Real-time conversations, right here.</div></div>}
      </section>
    </div><Toast toast={toast} />
  </div>;
}
