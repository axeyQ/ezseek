// services/queue/offlineQueueService.js
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

class OfflineQueueService {
  constructor() {
    this.queueKey = 'offline:queue';
  }

  // Add operation to queue
  async addToQueue(operation) {
    try {
      const queueItem = {
        id: `op_${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...operation
      };

      await redis.rpush(this.queueKey, JSON.stringify(queueItem));
      return queueItem.id;
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  // Process queue
  async processQueue() {
    try {
      const queueLength = await redis.llen(this.queueKey);
      
      for (let i = 0; i < queueLength; i++) {
        const item = await redis.lpop(this.queueKey);
        if (!item) continue;

        const operation = JSON.parse(item);
        
        try {
          await this.processOperation(operation);
          await this.logSuccess(operation);
        } catch (error) {
          await this.handleFailure(operation, error);
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      throw error;
    }
  }

  // Process individual operation
  async processOperation(operation) {
    switch (operation.type) {
      case 'createOrder':
        await this.processOfflineOrder(operation.data);
        break;
      case 'updateTable':
        await this.processTableUpdate(operation.data);
        break;
      case 'updateInventory':
        await this.processInventoryUpdate(operation.data);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  // Process offline order
  async processOfflineOrder(orderData) {
    try {
      // Implement order processing logic
      // This would typically involve creating the order in MongoDB
      // and updating related systems
      
      // Example:
      // await Order.create(orderData);
      // await updateInventory(orderData.items);
      // await notifyKitchen(orderData);
      
      return true;
    } catch (error) {
      console.error('Error processing offline order:', error);
      throw error;
    }
  }

  // Handle operation failure
  async handleFailure(operation, error) {
    const failureData = {
      operationId: operation.id,
      timestamp: new Date().toISOString(),
      error: error.message,
      operation: operation
    };

    await redis.rpush('offline:failed_operations', JSON.stringify(failureData));
  }

  // Log successful operation
  async logSuccess(operation) {
    const successData = {
      operationId: operation.id,
      timestamp: new Date().toISOString(),
      operation: operation
    };

    await redis.rpush('offline:completed_operations', JSON.stringify(successData));
  }

  // Get failed operations
  async getFailedOperations() {
    const operations = await redis.lrange('offline:failed_operations', 0, -1);
    return operations.map(op => JSON.parse(op));
  }

  // Retry failed operation
  async retryFailedOperation(operationId) {
    const operations = await this.getFailedOperations();
    const operation = operations.find(op => op.operationId === operationId);
    
    if (operation) {
      await this.addToQueue(operation.operation);
      return true;
    }
    
    return false;
  }
}

module.exports = new OfflineQueueService();