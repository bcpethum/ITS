const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, getAllUsers } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Validation rules — defined here and passed to routes as middleware arrays.
// express-validator checks these before the controller runs.
// ─────────────────────────────────────────────────────────────────────────────

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .optional()
    .isIn(['developer', 'manager', 'tester', 'admin'])
    .withMessage('Role must be one of: developer, manager, tester, admin'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me  — requires valid JWT
router.get('/me', protect, getMe);

// GET /api/auth/users — get all users for assignee dropdown, requires JWT
router.get('/users', protect, getAllUsers);

module.exports = router;
