import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const blogPostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  image: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema], // comments là mảng subdocument, có _id và createdAt
  createdAt: { type: Date, default: Date.now }
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;
