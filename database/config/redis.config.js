// database/config/redis.config.js
const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        console.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        this.isConnected = false;
        console.log('Redis connection closed');
      });

      // Test the connection
      await this.client.ping();

    } catch (error) {
      console.error('Redis initialization error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async set(key, value, expireSeconds = null) {
    try {
      const stringValue = JSON.stringify(value);
      if (expireSeconds) {
        await this.client.setex(key, expireSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      console.error(`Error setting key ${key}:`, error);
      throw error;
    }
  }

  async delete(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  // Cache middleware for Express routes
  cacheMiddleware(duration) {
    return async (req, res, next) => {
      if (!this.isConnected) {
        return next();
      }

      try {
        const key = `cache:${req.originalUrl}`;
        const cachedResponse = await this.get(key);

        if (cachedResponse) {
          return res.json(cachedResponse);
        }

        // Modify res.json to cache the response
        const originalJson = res.json;
        res.json = (body) => {
          this.set(key, body, duration);
          return originalJson.call(res, body);
        };

        next();
      } catch (error) {
        console.error('Cache middleware error:', error);
        next();
      }
    };
  }

  // Method to cache menu items
  async cacheMenu(menuItems) {
    try {
      await this.set('menu:items', menuItems, 3600); // Cache for 1 hour
    } catch (error) {
      console.error('Error caching menu:', error);
    }
  }

  // Method to cache table status
  async cacheTableStatus(tables) {
    try {
      await this.set('tables:status', tables, 300); // Cache for 5 minutes
    } catch (error) {
      console.error('Error caching table status:', error);
    }
  }

  // Method to invalidate cache by pattern
  async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }
}

// Create and export Redis singleton
const redisClient = new RedisClient();
module.exports = redisClient;