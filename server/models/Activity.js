const mongoose = require('mongoose');

/**
 * Activity Schema — auto-logged timeline entry for an Issue.
 *
 * action values:
 *   'created' | 'status_changed' | 'priority_changed' | 'title_changed'
 *   'assignee_changed' | 'commented' | 'attachment_added' | 'attachment_removed'
 */
const activitySchema = new mongoose.Schema(
  {
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    field: {
      type: String,
      default: null,
    },
    oldValue: {
      type: String,
      default: null,
    },
    newValue: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
