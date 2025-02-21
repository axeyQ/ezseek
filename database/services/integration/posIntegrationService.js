// services/integration/posIntegrationService.js
const realTimeService = require('../redis/realTimeService');
const offlineQueueService = require('../queue/offlineQueueService');

class POSIntegrationService {
  // Handle order creation
  async createOrder(orderData, isOffline = false) {
    try {
      if (isOffline) {
        // Add to offline queue
        await offlineQueueService.addToQueue({
          type: 'createOrder',
          data: orderData
        });
        return { queued: true, orderId: null };
      }

      // Process order normally
      const order = await Order.create(orderData);
      
      // Update KDS
      await realTimeService.updateKDS(order);
      
      // Update table status if applicable
      if (order.tableId) {
        await realTimeService.updateTableStatus(order.tableId, 'occupied');
      }

      return { success: true, order };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  // Handle table status updates
  async updateTableStatus(tableId, status, isOffline = false) {
    try {
      if (isOffline) {
        await offlineQueueService.addToQueue({
          type: 'updateTable',
          data: { tableId, status }
        });
        return { queued: true };
      }

      await realTimeService.updateTableStatus(tableId, status);
      return { success: true };
    } catch (error) {
      console.error('Error updating table status:', error);
      throw error;
    }
  }

  // Process offline queue
  async syncOfflineData() {
    try {
      await offlineQueueService.processQueue();
      return { success: true };
    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw error;
    }
  }

  // Subscribe to real-time updates
  subscribeToUpdates(channels, handler) {
    channels.forEach(channel => {
      realTimeService.subscribe(channel, handler);
    });
  }
}

module.exports = new POSIntegrationService();