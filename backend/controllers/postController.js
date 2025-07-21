import BlogPost from '../models/BlogPost.js';
import path from 'path';

export const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        const author = req.user.id;

        let imagePath = '';
        if (req.file) {
            imagePath = '/uploads/' + req.file.filename;
        }

        // Log để debug
        console.log('req.user:', req.user);
        console.log('req.file:', req.file);
        console.log('content:', content);

        const newPost = new BlogPost({
            author,
            content,
            image: imagePath
        });

        await newPost.save();
        const populatedPost = await BlogPost.findById(newPost._id)
            .populate('author', 'username firstName lastName avatar')
            .populate('comments.author', 'username firstName lastName avatar');

        res.status(201).json({
            success: true,
            post: {
                ...populatedPost._doc,
                createdAt: populatedPost.createdAt ? populatedPost.createdAt.toISOString() : null
            }
        });
    } catch (error) {
        console.error('Lỗi tạo bài viết:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// Lấy danh sách bài viết
export const getPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find()
            .populate('author', 'username firstName lastName avatar')
            .populate('comments.author', 'username firstName lastName avatar')
            .sort({ createdAt: -1 });
        const postsWithDate = posts.map(post => ({
            ...post._doc,
            createdAt: post.createdAt ? post.createdAt.toISOString() : null
        }));
        res.json({ success: true, posts: postsWithDate });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

export const likePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();
    }

    res.json({ success: true, likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    post.likes = post.likes.filter(id => id.toString() !== userId);
    await post.save();

    res.json({ success: true, likes: post.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const addComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user.id;
    const { text } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = {
      author: userId,
      text,
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();

    const updatedPost = await BlogPost.findById(postId)
      .populate('comments.author', 'username firstName lastName avatar');

    res.json({ success: true, comment, comments: updatedPost.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Thêm comment (đã có addComment)
// Sửa comment
export const updateComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    const userId = req.user.id;
    const { text } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.author.toString() !== userId) return res.status(403).json({ success: false, message: 'Not allowed' });

    comment.text = text;
    await post.save();

    const updatedPost = await BlogPost.findById(postId)
      .populate('comments.author', 'username firstName lastName avatar');
    res.json({ success: true, comment, comments: updatedPost.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Xóa comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Tìm comment
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Kiểm tra quyền xóa (chỉ cho phép chủ comment hoặc chủ post xóa)
    if (comment.author.toString() !== req.user.id && post.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Xóa comment
    comment.remove();
    await post.save();

    res.json({ success: true, comments: post.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error });
  }
};
