import User from '../models/User.js';
import mongoose from 'mongoose';
import Post from '../models/Post.js';
import Notification from '../models/Notification.js';
import { imageUrl } from '../middleware/upload.js';

const fields = 'fullName username email avatar coverImage bio location website isPrivate followers following createdAt';
const publicFields = 'fullName username avatar coverImage bio location website isPrivate followers following createdAt';

export async function myProfile(req, res) {
  const user = await User.findById(req.user._id).select(fields);
  res.json({ user });
}

export async function getProfile(req, res) {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).select(publicFields);
  if (!user) return res.status(404).json({ message: 'This profile could not be found.' });
  const isSelf = user._id.equals(req.user._id);
  const isFollowing = user.followers.some((id) => id.equals(req.user._id));
  const canViewPosts = !user.isPrivate || isSelf || isFollowing;
  const postCount = await Post.countDocuments({ author: user._id });
  res.json({ user, isSelf, isFollowing, canViewPosts, postCount });
}

export async function updateProfile(req, res, next) {
  try {
    const allowed = ['fullName', 'bio', 'location', 'website', 'isPrivate'];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    if (updates.fullName !== undefined && !String(updates.fullName).trim()) return res.status(400).json({ message: 'Name cannot be empty.' });
    if (updates.bio !== undefined && String(updates.bio).length > 180) return res.status(400).json({ message: 'Bio must be 180 characters or less.' });
    if (req.files?.avatar?.[0]) updates.avatar = imageUrl(req, req.files.avatar[0]);
    if (req.files?.coverImage?.[0]) updates.coverImage = imageUrl(req, req.files.coverImage[0]);
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select(fields);
    res.json({ user, message: 'Your profile has been updated.' });
  } catch (error) { next(error); }
}

export async function searchUsers(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ users: [] });
    const users = await User.find({ _id: { $ne: req.user._id }, $or: [
      { username: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { fullName: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ] }).select(publicFields).limit(15);
    res.json({ users });
  } catch (error) { next(error); }
}

export async function suggestedUsers(req, res) {
  const users = await User.find({ _id: { $ne: req.user._id, $nin: req.user.following } }).select(publicFields).sort({ createdAt: -1 }).limit(6);
  res.json({ users });
}

export async function followUser(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (target._id.equals(req.user._id)) return res.status(400).json({ message: 'You cannot follow yourself.' });
    const alreadyFollowing = target.followers.some((id) => id.equals(req.user._id));
    if (alreadyFollowing) {
      await User.updateOne({ _id: req.user._id }, { $pull: { following: target._id } });
      await User.updateOne({ _id: target._id }, { $pull: { followers: req.user._id } });
      return res.json({ following: false, message: 'You unfollowed this account.' });
    }
    await User.updateOne({ _id: req.user._id }, { $addToSet: { following: target._id } });
    await User.updateOne({ _id: target._id }, { $addToSet: { followers: req.user._id } });
    const notification = await Notification.create({ recipient: target._id, actor: req.user._id, type: 'follow' });
    const populated = await notification.populate('actor', 'fullName username avatar');
    req.io?.to(String(target._id)).emit('notification:new', populated);
    res.json({ following: true, message: 'You are now following this account.' });
  } catch (error) { next(error); }
}

export async function userPosts(req, res) {
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: 'User not found.' });
  const allowed = !target.isPrivate || target._id.equals(req.user._id) || target.followers.some((id) => id.equals(req.user._id));
  if (!allowed) return res.status(403).json({ message: 'Follow this account to see their posts.' });
  const posts = await Post.find({ author: target._id }).populate('author', 'fullName username avatar').sort({ createdAt: -1 });
  res.json({ posts: posts.map((post) => ({ ...post.toObject(), isBookmarked: req.user.bookmarks.some((id) => id.equals(post._id)) })) });
}

export async function toggleBookmark(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    const author = await User.findById(post.author).select('isPrivate followers');
    if (author?.isPrivate && !author._id.equals(req.user._id) && !author.followers.some((id) => id.equals(req.user._id))) return res.status(403).json({ message: 'Follow this account to save this post.' });
    const exists = req.user.bookmarks.some((id) => id.equals(post._id));
    await User.updateOne({ _id: req.user._id }, exists ? { $pull: { bookmarks: post._id } } : { $addToSet: { bookmarks: post._id } });
    res.json({ bookmarked: !exists });
  } catch (error) { next(error); }
}

export async function getBookmarks(req, res) {
  const user = await User.findById(req.user._id).select('bookmarks');
  const posts = await Post.find({ _id: { $in: user.bookmarks } }).populate('author', 'fullName username avatar isPrivate followers').sort({ createdAt: -1 });
  const visible = posts.filter((post) => !post.author.isPrivate || post.author._id.equals(req.user._id) || post.author.followers.some((id) => id.equals(req.user._id)));
  res.json({ posts: visible.map((post) => ({ ...post.toObject(), isBookmarked: true })) });
}
