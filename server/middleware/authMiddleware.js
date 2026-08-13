const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect Middleware
 * Validates the JWT token from the Authorization header.
 * Attaches the authenticated user to req.user for downstream handlers.
 * Usage: Add `protect` to any route that requires authentication.
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided. Please log in.',
    });
  }

  try {
    // Verify the token and decode the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from DB to ensure they still exist and get latest data
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    req.user = user; // Make user available to all downstream middleware/controllers
    next();
  } catch (error) {
    // Token expired or tampered with
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

module.exports = { protect };
