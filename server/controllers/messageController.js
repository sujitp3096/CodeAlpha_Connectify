import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

export async function listConversations(req, res) {
  const conversations = await Conversation.find({ participants: req.user._id }).populate('participants', 'fullName username avatar').populate({ path: 'lastMessage', populate: { path: 'sender', select: 'fullName username' } }).sort({ updatedAt: -1 });
  res.json({ conversations });
}

export async function startConversation(req, res, next) {
  try {
    const target = await User.findById(req.body.userId).select('fullName username avatar');
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target._id.equals(req.user._id)) return res.status(400).json({ message: 'You cannot start a conversation with yourself.' });
    let conversation = await Conversation.findOne({ participants: { $all: [req.user._id, target._id], $size: 2 } });
    if (!conversation) conversation = await Conversation.create({ participants: [req.user._id, target._id] });
    conversation = await Conversation.findById(conversation._id).populate('participants', 'fullName username avatar');
    res.status(200).json({ conversation });
  } catch (error) { next(error); }
}

export async function listMessages(req, res) {
  const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
  if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
  await Message.updateMany({ conversation: conversation._id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } }, { $addToSet: { readBy: req.user._id } });
  const messages = await Message.find({ conversation: conversation._id }).populate('sender', 'fullName username avatar').sort({ createdAt: 1 }).limit(300);
  const otherParticipants = conversation.participants.filter((id) => !id.equals(req.user._id));
  for (const participant of otherParticipants) req.io?.to(String(participant)).emit('messages:read', { conversationId: String(conversation._id), readerId: String(req.user._id) });
  res.json({ messages });
}

export async function sendMessage(req, res, next) {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write a message first.' });
    const conversation = await Conversation.findOne({ _id: req.params.id, participants: req.user._id });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found.' });
    const message = await Message.create({ conversation: conversation._id, sender: req.user._id, text, readBy: [req.user._id] });
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    await conversation.save();
    const populated = await message.populate('sender', 'fullName username avatar');
    const recipient = conversation.participants.find((id) => !id.equals(req.user._id));
    const n = await Notification.create({ recipient, actor: req.user._id, type: 'message', message: text.slice(0, 90) });
    req.io?.to(String(recipient)).emit('message:new', { message: populated, conversationId: String(conversation._id) });
    req.io?.to(String(recipient)).emit('notification:new', await n.populate('actor', 'fullName username avatar'));
    res.status(201).json({ message: populated });
  } catch (error) { next(error); }
}


export async function toggleMessageReaction(req, res, next) {
  try {
    const emoji = String(req.body.emoji || '');
    if (!['❤️', '😂', '👍', '✨', '😮'].includes(emoji)) return res.status(400).json({ message: 'Choose a supported reaction.' });
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    const conversation = await Conversation.findOne({ _id: message.conversation, participants: req.user._id });
    if (!conversation) return res.status(403).json({ message: 'You cannot react to this message.' });
    const existing = message.reactions.find((reaction) => reaction.user.equals(req.user._id));
    if (existing?.emoji === emoji) message.reactions = message.reactions.filter((reaction) => !reaction.user.equals(req.user._id));
    else if (existing) existing.emoji = emoji;
    else message.reactions.push({ user: req.user._id, emoji });
    await message.save();
    const payload = { messageId: String(message._id), conversationId: String(conversation._id), reactions: message.reactions };
    for (const participant of conversation.participants) req.io?.to(String(participant)).emit('message:reaction', payload);
    res.json({ reactions: message.reactions });
  } catch (error) { next(error); }
}
