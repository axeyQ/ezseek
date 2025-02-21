// frontend/src/services/offlineManager.js
import { indexedDBService } from './indexedDBService';

class OfflineManager {
  constructor() {
    this.syncInProgress = false;
  }

  async handleOfflineAction(action) {
    try {
      // Save action to IndexedDB
      await indexedDBService.addOfflineAction(action);

      // Create optimistic update
      const optimisticData = this.createOptimisticUpdate(action);
      await this.updateLocalData(action.type, optimisticData);

      // Try to sync if we're online
      if (navigator.onLine) {
        this.syncOfflineActions();
      }

      return optimisticData;
    } catch (error) {
      console.error('Error handling offline action:', error);
      throw error;
    }
  }

  async syncOfflineActions() {
    if (this.syncInProgress) return;
    this.syncInProgress = true;

    try {
      const actions = await indexedDBService.getOfflineActions();
      
      for (const action of actions) {
        try {
          // Process the action
          const result = await this.processAction(action);
          
          // Update local data with server response
          await this.updateLocalData(action.type, result);
          
          // Remove the processed action
          await indexedDBService.clearOfflineAction(action.id);
        } catch (error) {
          console.error('Error processing action:', error);
          // Keep the action in the queue if it failed
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async processAction(action) {
    const response = await fetch(action.url, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to process action: ${response.statusText}`);
    }

    return response.json();
  }

  createOptimisticUpdate(action) {
    const { type, data } = action;
    const tempId = `temp_${Date.now()}`;

    switch (type) {
      case 'CREATE_ORDER':
        return {
          _id: tempId,
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
          isOptimistic: true
        };

      case 'UPDATE_ORDER':
        return {
          ...data,
          updatedAt: new Date().toISOString(),
          isOptimistic: true
        };

      case 'CREATE_MENU_ITEM':
        return {
          _id: tempId,
          ...data,
          isOptimistic: true
        };

      default:
        return { ...data, isOptimistic: true };
    }
  }

  async updateLocalData(type, data) {
    const storeName = this.getStoreNameForType(type);
    await indexedDBService.saveData(storeName, data);
  }

  getStoreNameForType(type) {
    if (type.includes('ORDER')) return 'orders';
    if (type.includes('MENU')) return 'menuItems';
    if (type.includes('TABLE')) return 'tables';
    return 'misc';
  }

  async getOfflineData(type) {
    const storeName = this.getStoreNameForType(type);
    return indexedDBService.getData(storeName);
  }
}

export const offlineManager = new OfflineManager();