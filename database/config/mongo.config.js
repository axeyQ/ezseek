// database/config/mongo.config.js
const mongoose = require('mongoose');

const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Add connection pooling
  maxPoolSize: 10,
  // Add timeout settings
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  // Add retry settings
  retryWrites: true,
  // Add connection monitoring
  heartbeatFrequencyMS: 10000,
};

// Enhanced connection function with retry logic
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState) {
      console.log('MongoDB is already connected');
      return;
    }

    // Add retry logic
    let retries = 5;
    while (retries) {
      try {
        await mongoose.connect(process.env.MONGODB_URI, mongoConfig);
        console.log('MongoDB connected successfully');
        break;
      } catch (error) {
        retries -= 1;
        if (!retries) throw error;
        console.log(`Retrying connection... Attempts left: ${retries}`);
        // Wait for 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // Add connection event handlers
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;