// database/init.js
const connectDB = require('./config/mongo.config');
const redisClient = require('./config/redis.config');

async function initializeDatabases() {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await redisClient.connect();
    
    console.log('All database connections established successfully');
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    process.exit(1);
  }
}

module.exports = initializeDatabases;