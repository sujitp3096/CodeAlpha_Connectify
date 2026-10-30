import Notification from '../models/Notification.js';
export async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipient: req.user._id }).populate('actor', 'fullName username avatar').populate('post', 'imageUrl').sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ notifications, unreadCount });
}
export async function markRead(req, res) {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
  res.json({ message: 'Notifications marked as read.' });
}
