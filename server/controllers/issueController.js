const { validationResult } = require('express-validator');
const Issue = require('../models/Issue');

const POPULATE_FIELDS = [
  { path: 'reporter', select: 'name email avatarColor' },
  { path: 'assignee', select: 'name email avatarColor' },
];

// ─────────────────────────────────────────────────────────────────────────────
// @route   GET /api/issues
// @desc    Get all issues with optional filters + pagination
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
    if (search)   filter.title    = { $regex: search, $options: 'i' };

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
// @desc    Get single issue
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
      reporter: req.user._id, // Auto-set from JWT
      tags:     tags || [],
      dueDate:  dueDate || null,
    });

    await issue.populate(POPULATE_FIELDS);

    res.status(201).json({ success: true, message: 'Issue created successfully.', data: issue });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @route   PUT /api/issues/:id
// @desc    Update an issue (reporter or admin only)
// @access  Private
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

    if (!isReporter && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this issue.' });
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
// @desc    Delete an issue (reporter or admin only)
// @access  Private
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

    await issue.deleteOne();
    res.status(200).json({ success: true, message: 'Issue deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getIssues, getIssueStats, getIssue, createIssue, updateIssue, deleteIssue };
