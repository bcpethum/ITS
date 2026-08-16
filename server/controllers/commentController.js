const { body, validationResult } = require('express-validator');
const Comment  = require('../models/Comment');
const { logActivity } = require('./activityController');

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/issues/:id/comments
// @desc    Get all comments for an issue (oldest first)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ issue: req.params.id })
      .populate('author', 'name email avatarColor role')
      .sort({ createdAt: 1 }); // oldest → newest for natural reading

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/issues/:id/comments
// @desc    Add a comment to an issue
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const comment = await Comment.create({
      issue:   req.params.id,
      author:  req.user._id,
      content: req.body.content.trim(),
    });

    await comment.populate('author', 'name email avatarColor role');

    // Log activity (preview first 120 chars of comment)
    await logActivity(req.params.id, req.user._id, 'commented', null, null, req.body.content.trim().slice(0, 120));

    res.status(201).json({ success: true, message: 'Comment added.', data: comment });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/issues/:id/comments/:commentId
// @desc    Delete a comment (author or admin only)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments.' });
    }

    await comment.deleteOne();
    res.status(200).json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

// Validation rules for adding a comment
const commentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 2000 }).withMessage('Comment cannot exceed 2000 characters'),
];

module.exports = { getComments, addComment, deleteComment, commentValidation };
