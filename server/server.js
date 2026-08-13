require('dotenv').config(); // Load .env variables first before anything else

const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// Connect to MongoDB
// ─────────────────────────────────────────────────────────────────────────────
connectDB();

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Express App
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Core Middleware
// ─────────────────────────────────────────────────────────────────────────────

// Allow cross-origin requests from the React dev server
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form bodies (for potential form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
// Files uploaded to /uploads/ are accessible at GET /uploads/<filename>
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// Issue routes will be added in Phase 2
// app.use('/api/issues', issueRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// Health Check Endpoint
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Issue Tracker API is running 🚀' });
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 Handler — any unmatched route
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Global Error Handler — must be the LAST middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
