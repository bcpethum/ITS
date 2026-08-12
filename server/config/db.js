const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Logs success or exits the process on failure.
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1); // Exit with failure code so the server doesn't run without a DB
  }
};

module.exports = connectDB;
