const path = require('path');
const fs   = require('fs');
const { validationResult } = require('express-validator');
const Issue            = require('../models/Issue');
const Comment          = require('../models/Comment');
const { logActivity }  = require('./activityController');

const POPULATE_FIELDS = [
  { path: 'reporter', select: 'name email avatarColor' },
  { path: 'assignee', select: 'name email avatarColor' },
];

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/issues
// @desc    List issues — filters + search (title OR description) + pagination
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getIssues = async (req, res, next) => {
  try {
    const { status, priority, type, assignee, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (type)     filter.type     = type;
    if (assignee) filter.assignee = assignee;

    // Search matches title OR description (case-insensitive)
    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const skip     = (pageNum - 1) * limitNum;

    const [issues, total] = await Promise.all([
      Issue.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Issue.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        issues,
        pagination: {
          total,
          page:       pageNum,
          limit:      limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/issues/stats
// @desc    Aggregated counts for dashboard
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getIssueStats = async (req, res, next) => {
  try {
    const [statusCounts, priorityCounts, typeCounts, total] = await Promise.all([
      Issue.aggregate([{ $group: { _id: '$status',   count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Issue.aggregate([{ $group: { _id: '$type',     count: { $sum: 1 } } }]),
      Issue.countDocuments(),
    ]);

    const toMap = (arr) => arr.reduce((acc, { _id, count }) => ({ ...acc, [_id]: count }), {});

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus:   toMap(statusCounts),
        byPriority: toMap(priorityCounts),
        byType:     toMap(typeCounts),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/issues/:id
// @desc    Get a single issue (with populated assignee & reporter)
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id).populate(POPULATE_FIELDS);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });
    res.status(200).json({ success: true, data: issue });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { title, description, status, priority, type, assignee, tags, dueDate } = req.body;

    const issue = await Issue.create({
      title,
      description,
      status,
      priority,
      type,
      assignee: assignee || null,
      reporter: req.user._id,
      tags:     tags || [],
      dueDate:  dueDate || null,
    });

    await issue.populate(POPULATE_FIELDS);

    // Activity: created
    await logActivity(issue._id, req.user._id, 'created', null, null, title);

    res.status(201).json({ success: true, message: 'Issue created successfully.', data: issue });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/issues/:id
// @desc    Update an issue — logs activity for meaningful field changes
// @access  Private (reporter or admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateIssue = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    const isReporter = issue.reporter.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === 'admin';

    // Assignee is also allowed to update the status
    const isAssignee = issue.assignee && issue.assignee.toString() === req.user._id.toString();

    if (!isReporter && !isAdmin && !isAssignee) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this issue.' });
    }

    // Track changes for activity log
    const TRACKED = ['status', 'priority', 'type', 'assignee'];
    for (const field of TRACKED) {
      if (req.body[field] !== undefined) {
        const oldVal = String(issue[field] || '');
        const newVal = String(req.body[field] || '');
        if (oldVal !== newVal) {
          await logActivity(issue._id, req.user._id, `${field}_changed`, field, oldVal, newVal);
        }
      }
    }

    const allowedFields = ['title', 'description', 'status', 'priority', 'type', 'assignee', 'tags', 'dueDate'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) issue[field] = req.body[field];
    });

    await issue.save();
    await issue.populate(POPULATE_FIELDS);

    res.status(200).json({ success: true, message: 'Issue updated successfully.', data: issue });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/issues/:id
// @desc    Delete an issue + cascade-delete its comments
// @access  Private (reporter or admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteIssue = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    const isReporter = issue.reporter.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === 'admin';

    if (!isReporter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this issue.' });
    }

    // Delete all attachment files from disk
    for (const att of issue.attachments) {
      const filePath = path.join(__dirname, '../uploads', att.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Cascade-delete comments
    await Comment.deleteMany({ issue: issue._id });

    await issue.deleteOne();
    res.status(200).json({ success: true, message: 'Issue deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   POST /api/issues/:id/attachments
// @desc    Upload a file attachment to an issue
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    const attachment = {
      filename:     req.file.filename,
      originalName: req.file.originalname,
      mimetype:     req.file.mimetype,
      size:         req.file.size,
      uploadedBy:   req.user._id,
    };

    issue.attachments.push(attachment);
    await issue.save();

    await logActivity(issue._id, req.user._id, 'attachment_added', null, null, req.file.originalname);

    const saved = issue.attachments[issue.attachments.length - 1];
    res.status(201).json({ success: true, message: 'File uploaded.', data: saved });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   DELETE /api/issues/:id/attachments/:attachmentId
// @desc    Delete an attachment from an issue
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const deleteAttachment = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: 'Issue not found.' });

    const idx = issue.attachments.findIndex(
      (a) => a._id.toString() === req.params.attachmentId
    );
    if (idx === -1) return res.status(404).json({ success: false, message: 'Attachment not found.' });

    const att = issue.attachments[idx];
    const isUploader = att.uploadedBy && att.uploadedBy.toString() === req.user._id.toString();
    const isAdmin    = req.user.role === 'admin';
    const isReporter = issue.reporter.toString() === req.user._id.toString();

    if (!isUploader && !isAdmin && !isReporter) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this attachment.' });
    }

    // Remove from disk
    const filePath = path.join(__dirname, '../uploads', att.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    issue.attachments.splice(idx, 1);
    await issue.save();

    res.status(200).json({ success: true, message: 'Attachment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIssues, getIssueStats, getIssue,
  createIssue, updateIssue, deleteIssue,
  uploadAttachment, deleteAttachment,
};
