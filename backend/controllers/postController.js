import BlogPost from '../models/BlogPost.js';
import { createNotification } from './notificationController.js';
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
            .populate('comments.replies.author', 'username firstName lastName avatar')
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

// Lấy danh sách bài viết của một user cụ thể
export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log(`📊 Fetching posts for user: ${userId}`);
        const startTime = Date.now();
        
        // Get ALL posts for the user - no limit to ensure no posts are missing
        const posts = await BlogPost.find({ author: userId })
            .populate('author', 'username firstName lastName avatar')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username firstName lastName avatar'
                }
            })
            .populate({
                path: 'comments.replies',
                populate: {
                    path: 'author',
                    select: 'username firstName lastName avatar'
                }
            })
            .sort({ createdAt: -1 }); // No limit - show ALL posts
            
        const endTime = Date.now();
        console.log(`⏱️ Posts query took: ${endTime - startTime}ms - Found ${posts.length} posts`);
        
        const postsWithDate = posts.map(post => ({
            ...post._doc,
            createdAt: post.createdAt ? post.createdAt.toISOString() : null
        }));
        
        res.json({ success: true, posts: postsWithDate });
    } catch (error) {
        console.error('❌ getUserPosts error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

      // Create notification for post author (if not self-like)
      if (post.author.toString() !== userId) {
        await createNotification({
          recipient: post.author,
          sender: userId,
          type: 'like',
          postId: postId,
          message: 'liked your post'
        });
      }
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
    const { content, text } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = {
      author: userId,
      text: content || text, // Support both content and text fields
      createdAt: new Date()
    };
    post.comments.push(comment);
    await post.save();

    // Create notification for post author (if not self-comment)
    if (post.author.toString() !== userId) {
      await createNotification({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        postId: postId,
        message: 'commented on your post'
      });
    }

    const updatedPost = await BlogPost.findById(postId)
      .populate('comments.author', 'username firstName lastName avatar');

    // Return the last comment with both text and content fields for compatibility
    const lastComment = updatedPost.comments[updatedPost.comments.length - 1];
    const commentResponse = {
      ...lastComment.toObject(),
      content: lastComment.text // Add content field for frontend compatibility
    };

    res.json({ success: true, comment: commentResponse, comments: updatedPost.comments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Check if user owns the comment
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this comment' });
    }

    comment.text = content;
    await post.save();

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Check if user owns the comment
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    post.comments.pull(commentId);
    await post.save();

    res.json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
      await post.save();

      // Create notification for comment author (if not self-like)
      if (comment.author.toString() !== userId) {
        await createNotification(
          comment.author,
          userId,
          'like',
          postId,
          commentId,
          'liked your comment'
        );
      }
    }

    res.json({ success: true, likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unlikeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    comment.likes = comment.likes.filter(id => id.toString() !== userId);
    await post.save();

    res.json({ success: true, likes: comment.likes.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user.id;
    const { content, text } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = {
      author: userId,
      text: content || text,
      createdAt: new Date()
    };

    comment.replies.push(reply);
    await post.save();

    // Create notification for comment author (if not self-reply)
    if (comment.author.toString() !== userId) {
      await createNotification({
        recipient: comment.author,
        sender: userId,
        type: 'reply',
        postId: postId,
        commentId: commentId,
        message: 'replied to your comment'
      });
    }

    const updatedPost = await BlogPost.findById(postId)
      .populate('comments.author', 'username firstName lastName avatar')
      .populate('comments.replies.author', 'username firstName lastName avatar');

    const updatedComment = updatedPost.comments.id(commentId);
    const lastReply = updatedComment.replies[updatedComment.replies.length - 1];

    res.json({ success: true, reply: lastReply, comment: updatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user.id;
    const { content } = req.body;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

    // Check if user owns the reply
    if (reply.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this reply' });
    }

    reply.text = content;
    await post.save();

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user.id;

    const post = await BlogPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    const reply = comment.replies.id(replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found' });

    // Check if user owns the reply
    if (reply.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this reply' });
    }

    comment.replies.pull(replyId);
    await post.save();

    res.json({ success: true, message: 'Reply deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
