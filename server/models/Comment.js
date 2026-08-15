const mongoose = require('mongoose');

/**
 * Comment Schema — attached to a specific Issue.
 */
const commentSchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1,    'Comment cannot be empty'],
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
