'use client';

import { useState, useEffect } from 'react';
import websocketService from '@/services/websocketService';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('all');

  useEffect(() => {
    initializeWebSocket();
    fetchOrders();

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const initializeWebSocket = () => {
    const socket = websocketService.connect();

    // Listen for new orders
    socket.on('order:new', (newOrder) => {
      console.log('New order received:', newOrder);
      setOrders(prevOrders => sortOrders([...prevOrders, newOrder]));
    });

    // Listen for order updates
    socket.on('order:update', (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
      setOrders(prevOrders => {
        const updated = prevOrders.map(order => 
          order._id === updatedOrder._id ? updatedOrder : order
        );
        return sortOrders(updated);
      });
    });

    // Listen for order deletions
    socket.on('order:delete', (deletedOrderId) => {
      console.log('Order deleted:', deletedOrderId);
      setOrders(prevOrders => 
        prevOrders.filter(order => order._id !== deletedOrderId)
      );
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setError('Lost connection to server. Retrying...');
    });

    // Handle reconnection
    socket.on('reconnect', () => {
      console.log('Reconnected to server');
      setError(null);
      fetchOrders(); // Refresh orders after reconnection
    });
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(sortOrders(data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sortOrders = (ordersToSort) => {
    return ordersToSort
      .filter(order => !['served', 'cancelled'].includes(order.status))
      .sort((a, b) => {
        // Priority order: pending > preparing > ready
        const priority = { 'pending': 3, 'preparing': 2, 'ready': 1 };
        if (priority[a.status] !== priority[b.status]) {
          return priority[b.status] - priority[a.status];
        }
        // If same status, sort by creation time
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');
      
      // The update will come through WebSocket
      websocketService.emit('order:status', { orderId, status: newStatus });
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredOrders = orders.filter(order => {
    if (view === 'all') return true;
    return order.status === view;
  });

  if (loading) return <div className="p-4">Loading orders...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kitchen Display System</h1>
        <div className="flex gap-2">
          {['all', 'pending', 'preparing', 'ready'].map((status) => (
            <button
              key={status}
              onClick={() => setView(status)}
              className={`px-4 py-2 rounded ${
                view === status 
                  ? `${getStatusColor(status)} font-medium` 
                  : 'bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map(order => (
          <div key={order._id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium">
                  {order.orderType === 'dine-in' 
                    ? `Table ${order.tableId?.tableNumber}` 
                    : 'Takeaway'
                  }
                </h3>
                <p className="text-sm text-gray-500">
                  Order #{order._id.slice(-4)}
                </p>
                {/* // Add customer info to order cards */}
<div className="text-sm text-gray-600">
  Customer: {order.customerName} ({order.customerPhone})
</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="ml-2">{item.menuItem?.name}</span>
                    {item.notes && (
                      <p className="text-sm text-gray-500 ml-6">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {order.specialInstructions && (
              <div className="mb-4 p-2 bg-yellow-50 rounded">
                <p className="text-sm">
                  <span className="font-medium">Special Instructions: </span>
                  {order.specialInstructions}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="space-x-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'preparing')}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, 'ready')}
                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Mark Ready
                  </button>
                )}
              </div>
              {order.waiter && (
                <span className="text-sm text-gray-500">
                  Waiter: {order.waiter}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}