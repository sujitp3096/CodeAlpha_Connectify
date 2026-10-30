import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { imageUrl } from '../middleware/upload.js';

const postPopulate = [{ path: 'author', select: 'fullName username avatar isPrivate' }];
const getMentions = (text) => [...new Set([...String(text || '').matchAll(/@([a-z0-9_.]{3,24})/gi)].map((m) => m[1].toLowerCase()))];

async function canAccessPost(post, userId) {
  const author = await User.findById(post.author).select('isPrivate followers');
  return !!author && (!author.isPrivate || author._id.equals(userId) || author.followers.some((id) => id.equals(userId)));
}

export async function feed(req, res) {
  const posts = await Post.find().populate(postPopulate).sort({ createdAt: -1 }).limit(60);
  const accessible = posts.filter((post) => !post.author.isPrivate || post.author._id.equals(req.user._id) || req.user.following.some((id) => id.equals(post.author._id)));
  const ids = accessible.map((post) => post._id);
  const comments = await Comment.aggregate([{ $match: { post: { $in: ids } } }, { $group: { _id: '$post', count: { $sum: 1 } } }]);
  const countMap = new Map(comments.map((c) => [String(c._id), c.count]));
  res.json({ posts: accessible.map((post) => ({ ...post.toObject(), isBookmarked: req.user.bookmarks.some((id) => id.equals(post._id)), commentCount: countMap.get(String(post._id)) || 0 })) });
}

export async function explore(req, res) {
  const posts = await Post.find().populate(postPopulate).sort({ likes: -1, createdAt: -1 }).limit(48);
  const accessible = posts.filter((post) => !post.author.isPrivate || post.author._id.equals(req.user._id) || req.user.following.some((id) => id.equals(post.author._id)));
  res.json({ posts: accessible.map((post) => ({ ...post.toObject(), isBookmarked: req.user.bookmarks.some((id) => id.equals(post._id)) })) });
}

export async function createPost(req, res, next) {
  try {
    const caption = String(req.body.caption || '').trim();
    if (!caption && !req.file) return res.status(400).json({ message: 'Add a caption or choose an image to share.' });
    const hashtags = [...new Set([...caption.matchAll(/#([a-z0-9_]+)/gi)].map((m) => m[1].toLowerCase()))];
    const post = await Post.create({ author: req.user._id, caption, imageUrl: imageUrl(req, req.file), imageAlt: req.body.imageAlt || '', hashtags });
    const populated = await post.populate(postPopulate);
    for (const username of getMentions(caption)) {
      const mentioned = await User.findOne({ username, _id: { $ne: req.user._id } }).select('_id');
      if (mentioned) {
        const n = await Notification.create({ recipient: mentioned._id, actor: req.user._id, type: 'mention', post: post._id });
        req.io?.to(String(mentioned._id)).emit('notification:new', await n.populate('actor', 'fullName username avatar'));
      }
    }
    res.status(201).json({ post: populated, message: 'Your post is live.' });
  } catch (error) { next(error); }
}

export async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: 'You can only edit your own posts.' });
    if (req.body.caption !== undefined) {
      post.caption = String(req.body.caption).trim();
      post.hashtags = [...new Set([...post.caption.matchAll(/#([a-z0-9_]+)/gi)].map((m) => m[1].toLowerCase()))];
    }
    if (!post.caption && !post.imageUrl && !req.file) return res.status(400).json({ message: 'A post must contain text or an image.' });
    if (req.file) post.imageUrl = imageUrl(req, req.file);
    await post.save();
    res.json({ post: await post.populate(postPopulate), message: 'Post updated.' });
  } catch (error) { next(error); }
}

export async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (!post.author.equals(req.user._id)) return res.status(403).json({ message: 'You can only delete your own posts.' });
    await Promise.all([post.deleteOne(), Comment.deleteMany({ post: post._id }), User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } })]);
    res.json({ message: 'Post deleted.' });
  } catch (error) { next(error); }
}

export async function toggleLike(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (!(await canAccessPost(post, req.user._id))) return res.status(403).json({ message: 'Follow this account to interact with this post.' });
    const liked = post.likes.some((id) => id.equals(req.user._id));
    if (liked) post.likes.pull(req.user._id); else post.likes.addToSet(req.user._id);
    await post.save();
    if (!liked && !post.author.equals(req.user._id)) {
      const n = await Notification.create({ recipient: post.author, actor: req.user._id, type: 'like', post: post._id });
      req.io?.to(String(post.author)).emit('notification:new', await n.populate('actor', 'fullName username avatar'));
    }
    res.json({ liked: !liked, likes: post.likes.length });
  } catch (error) { next(error); }
}

export async function listComments(req, res) {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found.' });
  if (!(await canAccessPost(post, req.user._id))) return res.status(403).json({ message: 'Follow this account to view comments.' });
  const comments = await Comment.find({ post: req.params.id }).populate('author', 'fullName username avatar').sort({ createdAt: 1 });
  res.json({ comments });
}

export async function addComment(req, res, next) {
  try {
    const text = String(req.body.text || '').trim();
    if (!text) return res.status(400).json({ message: 'Write a comment first.' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (!(await canAccessPost(post, req.user._id))) return res.status(403).json({ message: 'Follow this account to comment.' });
    const comment = await Comment.create({ post: post._id, author: req.user._id, text });
    const populated = await comment.populate('author', 'fullName username avatar');
    if (!post.author.equals(req.user._id)) {
      const n = await Notification.create({ recipient: post.author, actor: req.user._id, type: 'comment', post: post._id, message: text.slice(0, 90) });
      req.io?.to(String(post.author)).emit('notification:new', await n.populate('actor', 'fullName username avatar'));
    }
    for (const username of getMentions(text)) {
      const mentioned = await User.findOne({ username, _id: { $ne: req.user._id } }).select('_id');
      if (mentioned && !mentioned._id.equals(post.author)) {
        const n = await Notification.create({ recipient: mentioned._id, actor: req.user._id, type: 'mention', post: post._id });
        req.io?.to(String(mentioned._id)).emit('notification:new', await n.populate('actor', 'fullName username avatar'));
      }
    }
    res.status(201).json({ comment: populated });
  } catch (error) { next(error); }
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });
    const post = await Post.findById(comment.post);
    if (!comment.author.equals(req.user._id) && !post?.author.equals(req.user._id)) return res.status(403).json({ message: 'You cannot delete this comment.' });
    await comment.deleteOne();
    res.json({ message: 'Comment deleted.' });
  } catch (error) { next(error); }
}

export async function trending(req, res) {
  const visibleAuthors = await User.find({ $or: [{ isPrivate: false }, { _id: req.user._id }, { _id: { $in: req.user.following } }] }).distinct('_id');
  const tags = await Post.aggregate([{ $match: { author: { $in: visibleAuthors } } }, { $unwind: '$hashtags' }, { $group: { _id: '$hashtags', posts: { $sum: 1 } } }, { $sort: { posts: -1 } }, { $limit: 8 }]);
  res.json({ hashtags: tags.map((tag) => ({ tag: tag._id, posts: tag.posts })) });
}
