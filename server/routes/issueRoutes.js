const express = require('express');
const { body } = require('express-validator');
const {
  getIssues, getIssueStats, getIssue,
  createIssue, updateIssue, deleteIssue,
  uploadAttachment, deleteAttachment,
} = require('../controllers/issueController');
const { getComments, addComment, deleteComment, commentValidation } = require('../controllers/commentController');
const { getActivity } = require('../controllers/activityController');
const { protect }   = require('../middleware/authMiddleware');
const upload        = require('../middleware/upload');

const router = express.Router();

// All issue routes require a valid JWT
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// Issue validation rules
// ─────────────────────────────────────────────────────────────────────────────
const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
  body('description').optional().isLength({ max: 5000 }).withMessage('Description max 5000 chars'),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('type').optional().isIn(['bug', 'feature', 'task', 'improvement']).withMessage('Invalid type'),
  body('assignee').optional({ nullable: true }).isMongoId().withMessage('Assignee must be a valid user ID'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Max 10 tags'),
  body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Invalid date'),
];

const updateValidation = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),
  body('description').optional().isLength({ max: 5000 }).withMessage('Description max 5000 chars'),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('type').optional().isIn(['bug', 'feature', 'task', 'improvement']).withMessage('Invalid type'),
  body('assignee').optional({ nullable: true })
    .custom((v) => v === null || v === '' || /^[a-fA-F0-9]{24}$/.test(v))
    .withMessage('Assignee must be a valid user ID or null'),
  body('tags').optional().isArray({ max: 10 }).withMessage('Max 10 tags'),
  body('dueDate').optional({ nullable: true })
    .custom((v) => v === null || v === '' || !isNaN(Date.parse(v)))
    .withMessage('Invalid date'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Core issue routes
// ─────────────────────────────────────────────────────────────────────────────

// Must be BEFORE /:id to avoid "stats" being treated as an ObjectId
router.get('/stats', getIssueStats);

router.route('/')
  .get(getIssues)
  .post(createValidation, createIssue);

router.route('/:id')
  .get(getIssue)
  .put(updateValidation, updateIssue)
  .delete(deleteIssue);

// ─────────────────────────────────────────────────────────────────────────────
// Comments  —  /api/issues/:id/comments
// ─────────────────────────────────────────────────────────────────────────────
router.route('/:id/comments')
  .get(getComments)
  .post(commentValidation, addComment);

router.delete('/:id/comments/:commentId', deleteComment);

// ─────────────────────────────────────────────────────────────────────────────
// Activity log  —  /api/issues/:id/activity
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/activity', getActivity);

// ─────────────────────────────────────────────────────────────────────────────
// File Attachments  —  /api/issues/:id/attachments
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/attachments', upload.single('file'), uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

module.exports = router;
