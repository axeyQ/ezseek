// services/indexedDBService.js
class IndexedDBService {
  constructor() {
    this.dbName = 'posOfflineDB';
    this.version = 1;
    this.db = null;
    this.storeNames = {
      ORDERS: 'orders',
      OFFLINE_ORDERS: 'offlineOrders',
      OFFLINE_ACTIONS: 'offlineActions',
      MENU_ITEMS: 'menuItems',
      TABLES: 'tables'
    };
  }

  async initDB() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB connected successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(this.storeNames.ORDERS)) {
          db.createObjectStore(this.storeNames.ORDERS, { keyPath: '_id' });
          console.log('Created orders store');
        }
        
        if (!db.objectStoreNames.contains(this.storeNames.OFFLINE_ORDERS)) {
          db.createObjectStore(this.storeNames.OFFLINE_ORDERS, { keyPath: '_id' });
          console.log('Created offline orders store');
        }
        
        if (!db.objectStoreNames.contains(this.storeNames.OFFLINE_ACTIONS)) {
          const offlineStore = db.createObjectStore(this.storeNames.OFFLINE_ACTIONS, { keyPath: 'id' });
          offlineStore.createIndex('timestamp', 'timestamp');
          offlineStore.createIndex('type', 'type');
          console.log('Created offline actions store');
        }
        
        if (!db.objectStoreNames.contains(this.storeNames.MENU_ITEMS)) {
          db.createObjectStore(this.storeNames.MENU_ITEMS, { keyPath: '_id' });
          console.log('Created menu items store');
        }
        
        if (!db.objectStoreNames.contains(this.storeNames.TABLES)) {
          db.createObjectStore(this.storeNames.TABLES, { keyPath: '_id' });
          console.log('Created tables store');
        }
      };
    });
  }

  async saveData(storeName, data) {
    try {
      await this.initDB();
      
      return new Promise((resolve, reject) => {
        if (!this.db.objectStoreNames.contains(storeName)) {
          reject(new Error(`Store ${storeName} not found`));
          return;
        }

        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };

        transaction.oncomplete = () => {
          resolve();
        };

        if (Array.isArray(data)) {
          data.forEach(item => store.put(item));
        } else {
          store.put(data);
        }
      });
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async getData(storeName, key = null) {
    try {
      await this.initDB();
      
      return new Promise((resolve, reject) => {
        if (!this.db.objectStoreNames.contains(storeName)) {
          reject(new Error(`Store ${storeName} not found`));
          return;
        }

        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = key ? store.get(key) : store.getAll();

        request.onerror = () => {
          console.error('Request error:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error getting data:', error);
      throw error;
    }
  }

  async addOfflineAction(action) {
    try {
      await this.saveData(this.storeNames.OFFLINE_ACTIONS, {
        ...action,
        timestamp: Date.now(),
        id: action.id || Date.now().toString()
      });
      console.log('Added offline action:', action);
    } catch (error) {
      console.error('Error adding offline action:', error);
      throw error;
    }
  }

  async deleteData(storeName, key) {
    try {
      await this.initDB();
      
      return new Promise((resolve, reject) => {
        if (!this.db.objectStoreNames.contains(storeName)) {
          reject(new Error(`Store ${storeName} not found`));
          return;
        }

        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onerror = () => {
          console.error('Delete error:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error deleting data:', error);
      throw error;
    }
  }

  async clearStore(storeName) {
    try {
      await this.initDB();
      
      return new Promise((resolve, reject) => {
        if (!this.db.objectStoreNames.contains(storeName)) {
          reject(new Error(`Store ${storeName} not found`));
          return;
        }

        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onerror = () => {
          console.error('Clear store error:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (error) {
      console.error('Error clearing store:', error);
      throw error;
    }
  }
}

export const indexedDBService = new IndexedDBService();