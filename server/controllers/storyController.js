import Story from '../models/Story.js';
import { imageUrl } from '../middleware/upload.js';

export async function storyFeed(req, res) {
  const stories = await Story.find({ expiresAt: { $gt: new Date() } }).populate('author', 'fullName username avatar isPrivate followers').sort({ createdAt: 1 });
  const grouped = new Map();
  for (const story of stories) {
    const author = story.author;
    const visible = !author.isPrivate || author._id.equals(req.user._id) || author.followers.some((id) => id.equals(req.user._id));
    if (!visible) continue;
    const key = String(author._id);
    if (!grouped.has(key)) grouped.set(key, { author: { _id: author._id, fullName: author.fullName, username: author.username, avatar: author.avatar }, stories: [] });
    grouped.get(key).stories.push({ _id: story._id, imageUrl: story.imageUrl, caption: story.caption, createdAt: story.createdAt, expiresAt: story.expiresAt, viewed: story.viewers.some((id) => id.equals(req.user._id)) });
  }
  res.json({ stories: [...grouped.values()] });
}

export async function createStory(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Choose an image for your story.' });
  const story = await Story.create({ author: req.user._id, imageUrl: imageUrl(req, req.file), caption: String(req.body.caption || '').trim().slice(0, 180) });
  res.status(201).json({ story: await story.populate('author', 'fullName username avatar') });
}

export async function viewStory(req, res) {
  const story = await Story.findOne({ _id: req.params.id, expiresAt: { $gt: new Date() } }).populate('author', 'fullName username avatar isPrivate followers');
  if (!story) return res.status(404).json({ message: 'This story has expired or is unavailable.' });
  const isOwner = story.author._id.equals(req.user._id);
  if (story.author.isPrivate && !isOwner) {
    const allowed = await story.author.populate('followers', '_id');
    if (!allowed.followers.some((person) => person._id.equals(req.user._id))) return res.status(403).json({ message: 'Follow this account to view their stories.' });
  }
  if (!isOwner) await Story.updateOne({ _id: story._id }, { $addToSet: { viewers: req.user._id } });
  res.json({ story: { ...story.toObject(), viewed: true } });
}

export async function deleteStory(req, res) {
  const story = await Story.findById(req.params.id);
  if (!story) return res.status(404).json({ message: 'Story not found.' });
  if (!story.author.equals(req.user._id)) return res.status(403).json({ message: 'You can only delete your own story.' });
  await story.deleteOne();
  res.json({ message: 'Story deleted.' });
}
