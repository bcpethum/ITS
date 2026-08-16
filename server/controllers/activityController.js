const Activity = require('../models/Activity');

// ─────────────────────────────────────────────────────────────────────────────
// Helper — call from any controller to record a timeline entry.
// Fire-and-forget; errors are swallowed so they never break the main request.
// ─────────────────────────────────────────────────────────────────────────────
const logActivity = async (issueId, userId, action, field = null, oldValue = null, newValue = null) => {
  try {
    await Activity.create({ issue: issueId, user: userId, action, field, oldValue, newValue });
  } catch (err) {
    console.error('[Activity] log error:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/issues/:id/activity
// @desc    Get full activity log for an issue (newest first)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getActivity = async (req, res, next) => {
  try {
    const activities = await Activity.find({ issue: req.params.id })
      .populate('user', 'name avatarColor')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

module.exports = { logActivity, getActivity };
