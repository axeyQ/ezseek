// services/redis/realTimeService.js
const Redis = require('ioredis');
const subscriber = new Redis(process.env.REDIS_URL);
const publisher = new Redis(process.env.REDIS_URL);

class RealTimeService {
  constructor() {
    this.channelHandlers = new Map();
    this.setupSubscriber();
  }

  setupSubscriber() {
    subscriber.on('message', (channel, message) => {
      const handlers = this.channelHandlers.get(channel) || [];
      handlers.forEach(handler => handler(JSON.parse(message)));
    });
  }

  // Subscribe to specific channels
  subscribe(channel, handler) {
    const handlers = this.channelHandlers.get(channel) || [];
    if (handlers.length === 0) {
      subscriber.subscribe(channel);
    }
    handlers.push(handler);
    this.channelHandlers.set(channel, handlers);
  }

  // Publish updates to channels
  async publish(channel, data) {
    try {
      await publisher.publish(channel, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error publishing to ${channel}:`, error);
      return false;
    }
  }

  // Store table status
  async updateTableStatus(tableId, status) {
    try {
      await publisher.set(`table:${tableId}:status`, JSON.stringify(status));
      await this.publish('table-updates', { tableId, status });
    } catch (error) {
      console.error('Error updating table status:', error);
      throw error;
    }
  }

  // Store active orders
  async updateOrderStatus(orderId, status) {
    try {
      await publisher.set(`order:${orderId}:status`, JSON.stringify(status));
      await this.publish('order-updates', { orderId, status });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  // Kitchen Display System (KDS) updates
  async updateKDS(order) {
    try {
      await publisher.set(`kds:order:${order.id}`, JSON.stringify(order));
      await this.publish('kds-updates', order);
    } catch (error) {
      console.error('Error updating KDS:', error);
      throw error;
    }
  }

  // Method to clear all data for a specific table
  async clearTableData(tableId) {
    try {
      await publisher.del(`table:${tableId}:status`);
      await this.publish('table-updates', { tableId, status: 'available' });
    } catch (error) {
      console.error('Error clearing table data:', error);
      throw error;
    }
  }

  // Method to get all active orders
  async getActiveOrders() {
    try {
      const keys = await publisher.keys('order:*:status');
      const orders = await Promise.all(
        keys.map(async (key) => {
          const data = await publisher.get(key);
          return JSON.parse(data);
        })
      );
      return orders;
    } catch (error) {
      console.error('Error getting active orders:', error);
      throw error;
    }
  }
}

module.exports = new RealTimeService();