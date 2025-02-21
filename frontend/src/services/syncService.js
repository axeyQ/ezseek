// frontend/src/services/syncService.js
import useStore from '../store/realTimeStore';

class SyncService {
  constructor() {
    this.store = useStore.getState();
  }

  async performAction(actionType, data) {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      try {
        const response = await this.sendRequest(actionType, data);
        return response;
      } catch (error) {
        console.error('Error performing action:', error);
        this.queueOfflineAction(actionType, data);
        throw error;
      }
    } else {
      this.queueOfflineAction(actionType, data);
      return this.getOptimisticResponse(actionType, data);
    }
  }

  async sendRequest(actionType, data) {
    const endpoint = this.getEndpoint(actionType);
    const method = this.getMethod(actionType);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  queueOfflineAction(actionType, data) {
    const action = {
      id: Date.now().toString(),
      type: actionType,
      data,
      timestamp: Date.now()
    };

    this.store.addToOfflineQueue(action);
  }

  getOptimisticResponse(actionType, data) {
    // Create optimistic response based on action type
    switch (actionType) {
      case 'CREATE_ORDER':
        return {
          ...data,
          _id: `temp_${Date.now()}`,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
      case 'UPDATE_ORDER':
        return {
          ...data,
          updatedAt: new Date().toISOString()
        };
      // Add other cases as needed
      default:
        return data;
    }
  }

  getEndpoint(actionType) {
    const endpoints = {
      'CREATE_ORDER': '/api/orders',
      'UPDATE_ORDER': '/api/orders',
      'CREATE_MENU_ITEM': '/api/menu',
      'UPDATE_MENU_ITEM': '/api/menu',
      'UPDATE_TABLE': '/api/tables'
    };
    return endpoints[actionType];
  }

  getMethod(actionType) {
    if (actionType.startsWith('CREATE')) return 'POST';
    if (actionType.startsWith('UPDATE')) return 'PUT';
    if (actionType.startsWith('DELETE')) return 'DELETE';
    return 'GET';
  }
}

export const syncService = new SyncService();