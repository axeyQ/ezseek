'use client';

import { useState, useEffect } from 'react';
import useStore from '@/store/store';
import websocketService from '@/services/websocketService';
import { indexedDBService } from '@/services/indexedDBService';
import CustomerLookup from '@/components/CustomerLookup';
import CustomerForm from '@/components/CustomerForm';
export default function OrdersManagement() {
  const {
    orders,
    tables,
    menuItems,
    isOnline,
    createOrder,
    updateOrder,
    fetchOrders,
    fetchTables,
    fetchMenuItems,
    addOfflineOrder 
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [orderForm, setOrderForm] = useState({
    tableId: '',
    items: [],
    specialInstructions: '',
    orderType: 'dine-in',
    waiter: ''
  });

  // Add the calculateTotal function back
  const calculateTotal = () => {
    return orderForm.items.reduce((total, item) => {
      const menuItem = menuItems.find(mi => mi._id === item.menuItem);
      return total + (menuItem?.price || 0) * item.quantity;
    }, 0);
  };

  // Example usage in OrdersManagement
const handleOfflineOrder = async (orderData) => {
  try {
    // Save offline order
    await indexedDBService.saveData(indexedDBService.storeNames.OFFLINE_ORDERS, orderData);
    
    // Add to offline actions queue
    await indexedDBService.addOfflineAction({
      type: 'CREATE_ORDER',
      data: orderData,
      id: orderData._id
    });
  } catch (error) {
    console.error('Error handling offline order:', error);
    throw error;
  }
};

    // Add this to your useEffect to handle online/offline transitions
    useEffect(() => {
      const handleOnline = async () => {
        try {
          // Get orders from IndexedDB
          const offlineOrders = await indexedDBService.getData(
            indexedDBService.storeNames.ORDERS
          );
  
          // Filter for offline orders
          const ordersToSync = offlineOrders.filter(order => order.isOffline);
  
          // Process offline orders
          for (const order of ordersToSync) {
            try {
              // Remove isOffline flag and temporary ID
              const { isOffline, _id, ...orderData } = order;
              
              // Create the order online
              await createOrder(orderData);
              
              // Remove from IndexedDB
              await indexedDBService.deleteData(
                indexedDBService.storeNames.ORDERS,
                _id
              );
            } catch (error) {
              console.error('Error syncing offline order:', error);
            }
          }
  
          // Refresh orders
          await fetchOrders();
        } catch (error) {
          console.error('Error processing offline orders:', error);
        }
      };
  
      window.addEventListener('online', handleOnline);
      return () => window.removeEventListener('online', handleOnline);
    }, []);

  useEffect(() => {
    initializeData();
    initializeWebSocket();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const initializeData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTables(),
        fetchMenuItems(),
        fetchOrders()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const initializeWebSocket = () => {
    const socket = websocketService.connect();

    socket.on('order:update', (updatedOrder) => {
      fetchOrders();
    });

    socket.on('table:update', (updatedTable) => {
      fetchTables();
    });
  };

  const handleTableSelect = (table) => {
    setSelectedTable(table);
    setOrderForm(prev => ({ ...prev, tableId: table._id }));
  };

  const addItemToOrder = (menuItem) => {
    setOrderForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          menuItem: menuItem._id,
          name: menuItem.name, // Store name directly
          quantity: 1,
          notes: '',
          price: menuItem.price
        }
      ]
    }));
  };

  const removeItemFromOrder = (index) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemQuantity = (index, quantity) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: parseInt(quantity) } : item
      )
    }));
  };

  const updateItemNotes = (index, notes) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, notes } : item
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!orderForm.tableId || orderForm.items.length === 0) {
        setError('Please select a table and add items to the order');
        return;
      }
      if (!selectedCustomer) {
        setError('Please select a customer');
        return;
      }

          // Get selected table details for offline use
    const selectedTableDetails = tables.find(t => t._id === orderForm.tableId);

      const orderData = {
        ...orderForm,
        totalAmount: calculateTotal(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        // Add table details for offline display
        tableNumber: selectedTableDetails?.tableNumber, // Store table number
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        // If delivery order, use customer's default address
        deliveryAddress: orderForm.orderType === 'delivery' 
          ? selectedCustomer.addresses.find(addr => addr.isDefault)
          : null
      };

      if (!isOnline) {
        const offlineOrder = {
          ...orderData,
          _id: `temp_${Date.now()}`,
          isOffline: true,
                  // Keep the menuItemDetails in the items
        items: orderData.items.map(item => ({
          ...item,
          name: menuItems.find(mi => mi._id === item.menuItem)?.name || item.name
        }))
        };
        // Save to the orders store instead of offlineOrders
        await indexedDBService.saveData('orders',offlineOrder);
        
        // Add to offline actions queue
        await indexedDBService.addOfflineAction({
          type: 'CREATE_ORDER',
          data: {
            ...orderData,
            items: orderData.items.map(item => ({
              menuItem: item.menuItem,
              quantity: item.quantity,
              notes: item.notes,
              price: item.price
            }))
          }
        });

        // Update local state
        addOfflineOrder(orderData);

        // Show success message for offline mode
        setError('Order saved offline. Will sync when online.');
      } else {
            // Online order creation - clean up the data
            const onlineOrderData = {
              ...orderData,
              items: orderData.items.map(item => ({
                menuItem: item.menuItem,
                quantity: item.quantity,
                notes: item.notes,
                price: item.price
              }))
            };
            await createOrder(onlineOrderData);
      }


      setShowNewOrderForm(false);
      setSelectedTable(null);
      setOrderForm({
        tableId: '',
        items: [],
        specialInstructions: '',
        orderType: 'dine-in',
        waiter: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
    } catch (err) {
      setError(err.message);
    }
  };

  // Update the order display rendering
const renderOrderItems = (order) => {
  return order.items.map((item, index) => {
    // For offline orders, use the stored details
    const itemName = order.isOffline ? 
      item.menuItem.name : // Use stored details for offline orders
      item.menuItem?.name; // Use populated data for online orders

    return (
      <div key={index} className="flex justify-between text-sm">
        <span>{item.quantity}x {itemName}</span>
        <span>${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    );
  });
};
  return (
    <div className="p-4 max-w-7xl mx-auto">
         {/* Add offline indicator */}
         {!isOnline && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-4">
          You are currently offline. Changes will sync when you reconnect.
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
        <button
          onClick={() => setShowNewOrderForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Order
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {/* New Order Form Modal */}
      {showNewOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New Order</h2>
              {/* Customer Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Customer</label>
              <CustomerLookup
                onSelectCustomer={setSelectedCustomer}
                onCreateCustomer={() => setShowCustomerForm(true)}
              />
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-blue-50 rounded">
                  <div className="font-medium">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedCustomer.phone}
                  </div>
                  {selectedCustomer.addresses?.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      Default Address: {
                        selectedCustomer.addresses.find(addr => addr.isDefault)?.street
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
              <button 
                onClick={() => setShowNewOrderForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Table Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Select Table</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {tables.map(table => (
                    <button
                      key={table._id}
                      type="button"
                      onClick={() => handleTableSelect(table)}
                      disabled={table.status === 'occupied'}
                      className={`p-4 rounded border ${
                        selectedTable?._id === table._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      } ${
                        table.status === 'occupied'
                          ? 'bg-red-50 cursor-not-allowed'
                          : 'hover:border-blue-500'
                      }`}
                    >
                      <div className="font-medium">Table {table.tableNumber}</div>
                      <div className="text-sm text-gray-500">
                        Capacity: {table.capacity}
                      </div>
                      <div className={`text-sm ${
                        table.status === 'occupied' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {table.status}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Add Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Menu Items</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {menuItems.map(item => (
                        <div
                          key={item._id}
                          className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => addItemToOrder(item)}
                        >
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-500">${item.price}</div>
                          </div>
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-600"
                          >
                            + Add
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-medium mb-2">Selected Items</h4>
                    <div className="space-y-2">
                      {orderForm.items.map((item, index) => {
                        const menuItem = menuItems.find(mi => mi._id === item.menuItem);
                        return (
                          <div key={index} className="border-b pb-2">
                            <div className="flex justify-between items-center">
                              <div className="font-medium">{menuItem?.name}</div>
                              <button
                                type="button"
                                onClick={() => removeItemFromOrder(index)}
                                className="text-red-500 hover:text-red-600"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, e.target.value)}
                                className="w-20 p-1 border rounded"
                              />
                              <input
                                type="text"
                                placeholder="Notes"
                                value={item.notes}
                                onChange={(e) => updateItemNotes(index, e.target.value)}
                                className="flex-1 p-1 border rounded"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {orderForm.items.length > 0 && (
                        <div className="text-right font-bold">
                          Total: ${calculateTotal().toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Order Type</label>
                    <select
                      value={orderForm.orderType}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, orderType: e.target.value }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="dine-in">Dine In</option>
                      <option value="takeaway">Takeaway</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Waiter</label>
                    <input
                      type="text"
                      value={orderForm.waiter}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, waiter: e.target.value }))}
                      className="w-full p-2 border rounded"
                      placeholder="Enter waiter name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Special Instructions</label>
                    <textarea
                      value={orderForm.specialInstructions}
                      onChange={(e) => setOrderForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
                      className="w-full p-2 border rounded"
                      rows="3"
                      placeholder="Enter any special instructions"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Orders List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders
            .filter(order => order.status !== 'served' && order.status !== 'cancelled')
            .map(order => (
              <div key={order._id} className={`border rounded-lg p-4 ${order.isOffline ? 'bg-yellow-50' : ''}`}>
              {order.isOffline && (
        <div className="text-yellow-600 text-sm mb-2">
          ⚠️ Offline Order - Will sync when online
        </div>
      )}
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">
                     {/* Use stored table details for offline orders */}
              Table {order.isOffline ? 
                order.tableDetails?.tableNumber : 
                order.tableId?.tableNumber || 'Takeaway'}
                  </h3>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={`px-2 py-1 rounded text-sm ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'ready' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                    <option value="served">Served</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-2">
                {renderOrderItems(order)}
                </div>

                {order.specialInstructions && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Notes: </span>
                    {order.specialInstructions}
                  </div>
                )}

                <div className="mt-4 pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${order.totalAmount?.toFixed(2)}</span>
                  </div>
                  {order.waiter && (
                    <div className="text-sm text-gray-500 mt-1">
                      Waiter: {order.waiter}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {/* Add Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          onClose={() => setShowCustomerForm(false)}
          onSave={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerForm(false);
          }}
        />
      )}
    </div>
  );
}