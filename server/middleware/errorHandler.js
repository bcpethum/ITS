/**
 * Global Error Handler Middleware
 * Must be the LAST middleware registered in server.js (after all routes).
 * Catches any error passed via next(error) or thrown from async handlers.
 *
 * Sends a consistent JSON error response so the frontend always gets
 * the same shape: { success: false, message: "...", errors: [...] }
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status was set on the error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // --- Mongoose Validation Error ---
  // Triggered when a document fails schema validation rules
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // --- Mongoose Duplicate Key Error ---
  // Triggered when a unique field (e.g. email) already exists in the DB
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists.`;
  }

  // --- Mongoose Cast Error ---
  // Triggered when an invalid ObjectId is passed (e.g. /issues/not-valid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // --- JWT Errors ---
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please log in again.';
  }

  // Log full error in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }), // Only include errors array if non-empty
  });
};

module.exports = errorHandler;
