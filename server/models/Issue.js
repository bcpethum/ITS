const mongoose = require('mongoose');

/**
 * Issue Schema
 * Core data model for the Issue Tracker.
 */
const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3,   'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
      default: '',
    },

    status: {
      type: String,
      enum: { values: ['open', 'in-progress', 'resolved', 'closed'], message: 'Invalid status' },
      default: 'open',
    },

    priority: {
      type: String,
      enum: { values: ['low', 'medium', 'high', 'critical'], message: 'Invalid priority' },
      default: 'medium',
    },

    type: {
      type: String,
      enum: { values: ['bug', 'feature', 'task', 'improvement'], message: 'Invalid type' },
      default: 'task',
    },

    // The user who created the issue — auto-set in the controller
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter is required'],
    },

    // Optional: user the issue is assigned to
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for fast filtered queries
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ type: 1 });
issueSchema.index({ reporter: 1 });
issueSchema.index({ assignee: 1 });
issueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
