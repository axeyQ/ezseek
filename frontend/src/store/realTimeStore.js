// frontend/src/store/realTimeStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useStore = create(
  persist(
    (set, get) => ({
      orders: [],
      tables: [],
      menuItems: [],
      offlineQueue: [],
      isOnline: true,

      // Orders
      setOrders: (orders) => set({ orders }),
      updateOrder: (updatedOrder) => set(state => ({
        orders: state.orders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        )
      })),
      addOrder: (newOrder) => set(state => ({
        orders: [...state.orders, newOrder]
      })),

      // Tables
      setTables: (tables) => set({ tables }),
      updateTable: (updatedTable) => set(state => ({
        tables: state.tables.map(table => 
          table._id === updatedTable._id ? updatedTable : table
        )
      })),

      // Menu Items
      setMenuItems: (menuItems) => set({ menuItems }),
      updateMenuItem: (updatedItem) => set(state => ({
        menuItems: state.menuItems.map(item => 
          item._id === updatedItem._id ? updatedItem : item
        )
      })),

      // Offline Queue
      addToOfflineQueue: (action) => set(state => ({
        offlineQueue: [...state.offlineQueue, { ...action, timestamp: Date.now() }]
      })),
      removeFromOfflineQueue: (actionId) => set(state => ({
        offlineQueue: state.offlineQueue.filter(action => action.id !== actionId)
      })),
      clearOfflineQueue: () => set({ offlineQueue: [] }),

      // Online Status
      setOnlineStatus: (isOnline) => set({ isOnline }),

      // Sync offline data
      syncOfflineData: async () => {
        const state = get();
        if (state.isOnline && state.offlineQueue.length > 0) {
          for (const action of state.offlineQueue) {
            try {
              await processOfflineAction(action);
              state.removeFromOfflineQueue(action.id);
            } catch (error) {
              console.error('Error processing offline action:', error);
            }
          }
        }
      }
    }),
    {
      name: 'pos-store',
      partialize: (state) => ({
        orders: state.orders,
        menuItems: state.menuItems,
        offlineQueue: state.offlineQueue
      })
    }
  )
);

async function processOfflineAction(action) {
  const { type, data } = action;
  const endpoint = getEndpointForAction(type);
  
  const response = await fetch(endpoint, {
    method: getMethodForAction(type),
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`Failed to process offline action: ${type}`);
  }

  return response.json();
}

function getEndpointForAction(type) {
  const endpoints = {
    'CREATE_ORDER': '/api/orders',
    'UPDATE_ORDER': '/api/orders',
    'CREATE_MENU_ITEM': '/api/menu',
    'UPDATE_MENU_ITEM': '/api/menu',
    'UPDATE_TABLE': '/api/tables'
  };
  return endpoints[type];
}

function getMethodForAction(type) {
  if (type.startsWith('CREATE')) return 'POST';
  if (type.startsWith('UPDATE')) return 'PUT';
  if (type.startsWith('DELETE')) return 'DELETE';
  return 'GET';
}

export default useStore;