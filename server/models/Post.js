import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  caption: { type: String, trim: true, maxlength: 2200, default: '' },
  imageUrl: { type: String, default: '' },
  imageAlt: { type: String, default: '' },
  hashtags: [{ type: String, lowercase: true }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
postSchema.index({ createdAt: -1 });
export default mongoose.model('Post', postSchema);
