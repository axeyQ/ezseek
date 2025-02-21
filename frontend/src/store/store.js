// frontend/src/store/store.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { indexedDBService } from '@/services/indexedDBService';

const useStore = create(
  persist(
    (set, get) => ({
      orders: [],
      menuItems: [],
      tables: [],
      isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,

      addOfflineOrder: (order) => {
        set(state => ({
          orders: [...state.orders, order]
        }));
      },

      syncOfflineData: async () => {
        const state = get();
        if (!state.isOnline || state.isSyncing) return;

        try {
          set({ isSyncing: true });
          
          // Get all offline actions
          const offlineActions = await indexedDBService.getData('offlineActions');
          
          // Process each action
          for (const action of offlineActions) {
            try {
              switch (action.type) {
                case 'CREATE_ORDER':
                  await state.createOrder(action.data);
                  break;
                case 'UPDATE_ORDER':
                  await state.updateOrder(action.data.orderId, action.data.updates);
                  break;
                // Add other cases as needed
              }
              
              // Remove processed action
              await indexedDBService.deleteData('offlineActions', action.id);
            } catch (error) {
              console.error('Error processing offline action:', error);
            }
          }

          // Refresh data
          await state.initializeStore();
        } finally {
          set({ isSyncing: false });
        }
      },

      // Initialize store with offline data
      initializeStore: async () => {
        try {
          const [orders, menuItems, tables] = await Promise.all([
            get().fetchOrders(),
            get().fetchMenuItems(),
            get().fetchTables()
          ]);

          set({ orders, menuItems, tables });
        } catch (error) {
          console.error('Error initializing store:', error);
        }
      },

      // Orders
      fetchOrders: async () => {
        try {
          const response = await fetch('/api/orders');
          if (!response.ok) throw new Error('Failed to fetch orders');
          const data = await response.json();
          set({ orders: data });
          return data;
        } catch (error) {
          console.error('Error fetching orders:', error);
          return [];
        }
      },
      addOfflineOrder: (order) => set(state => ({
        orders: [...state.orders, order]
      })),

      createOrder: async (orderData) => {
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });
          if (!response.ok) throw new Error('Failed to create order');
          const newOrder = await response.json();
          set(state => ({ orders: [...state.orders, newOrder] }));
          return newOrder;
        } catch (error) {
          console.error('Error creating order:', error);
          throw error;
        }
      },

      updateOrder: async (orderId, updateData) => {
        try {
          const response = await fetch(`/api/orders?id=${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          if (!response.ok) throw new Error('Failed to update order');
          const updatedOrder = await response.json();
          set(state => ({
            orders: state.orders.map(order => 
              order._id === orderId ? updatedOrder : order
            )
          }));
          return updatedOrder;
        } catch (error) {
          console.error('Error updating order:', error);
          throw error;
        }
      },

      // Menu Items
      fetchMenuItems: async () => {
        try {
          const response = await fetch('/api/menu');
          if (!response.ok) throw new Error('Failed to fetch menu items');
          const data = await response.json();
          set({ menuItems: data });
          return data;
        } catch (error) {
          console.error('Error fetching menu items:', error);
          return [];
        }
      },

      // Tables
      fetchTables: async () => {
        try {
          const response = await fetch('/api/tables');
          if (!response.ok) throw new Error('Failed to fetch tables');
          const data = await response.json();
          set({ tables: data });
          return data;
        } catch (error) {
          console.error('Error fetching tables:', error);
          return [];
        }
      },

      // Online Status
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        if (status && !get().isSyncing) {
          get().syncOfflineData();
        }
      },

      // Sync Status
      setSyncing: (status) => set({ isSyncing: status }),

      // Sync offline data
      syncOfflineData: async () => {
        const state = get();
        if (!state.isOnline || state.isSyncing) return;

        try {
          state.setSyncing(true);
          // Implement sync logic here
          await state.initializeStore();
        } finally {
          state.setSyncing(false);
        }
      }
    }),
    {
      name: 'pos-store',
      // Only persist these fields
      partialize: (state) => ({
        orders: state.orders.filter(order => !order.isOffline),
        menuItems: state.menuItems,
        tables: state.tables
      })
    }
  )
);

// Add event listeners for online/offline status if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useStore.getState().setOnlineStatus(true);
  });
  
  window.addEventListener('offline', () => {
    useStore.getState().setOnlineStatus(false);
  });
}

export default useStore;