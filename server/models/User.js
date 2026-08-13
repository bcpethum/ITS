const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores authentication credentials and display info.
 * Passwords are hashed before saving — never stored as plain text.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Never returned in queries unless explicitly requested
    },

    // Used to generate a consistent avatar color from the user's name initials
    avatarColor: {
      type: String,
      default: () => {
        const colors = [
          '#6C63FF', '#00D9C0', '#FF6B6B', '#F7B731',
          '#26de81', '#a29bfe', '#fd79a8', '#00cec9',
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },

    role: {
      type: String,
      enum: ['developer', 'manager', 'tester', 'admin'],
      default: 'developer',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

/**
 * Pre-save hook: Hash the password before saving to the database.
 * Only runs when the password field has been modified.
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12); // Cost factor of 12 for strong security
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method: Compare a plain-text password against the stored hash.
 * Used during login to verify credentials.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
