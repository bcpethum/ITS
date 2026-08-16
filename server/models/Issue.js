const mongoose = require('mongoose');

/**
 * Issue Schema — updated with attachments subdocument array.
 */
const attachmentSchema = new mongoose.Schema({
  filename:     { type: String, required: true },   // stored on disk
  originalName: { type: String, required: true },   // original upload name
  mimetype:     { type: String, required: true },
  size:         { type: Number, required: true },   // bytes
  uploadedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt:   { type: Date, default: Date.now },
}, { _id: true });

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

    // User who created the issue — auto-set in controller
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

    // File attachments (Phase 4)
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// ── Indexes for fast filtered queries ──────────────────────────────────────
issueSchema.index({ status: 1 });
issueSchema.index({ priority: 1 });
issueSchema.index({ type: 1 });
issueSchema.index({ reporter: 1 });
issueSchema.index({ assignee: 1 });
issueSchema.index({ createdAt: -1 });
// Text index for full-text search on title + description
issueSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Issue', issueSchema);
