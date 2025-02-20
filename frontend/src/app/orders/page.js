// app/orders/page.js
'use client'; // Mark as a Client Component

import { useState, useEffect } from 'react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [newOrder, setNewOrder] = useState({
    item: {
      name: '',
      price: '',
      description: ''
    },
    status: 'pending'
  });

  useEffect(() => {
    // Set up online/offline listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    fetchOrders();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      if (navigator.onLine) {
        // Try to fetch from API if online
        const response = await fetch('/api/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }
        const data = await response.json();
        setOrders(data);
        // Update localStorage with latest data
        localStorage.setItem('orders', JSON.stringify(data));
      } else {
        // Use localStorage if offline
        const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
        setOrders(savedOrders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      // Fallback to localStorage if API fails
      const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
      setOrders(savedOrders);
      setError('Using offline data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('item.')) {
      const itemField = name.split('.')[1];
      setNewOrder(prev => ({
        ...prev,
        item: {
          ...prev.item,
          [itemField]: value
        }
      }));
    } else {
      setNewOrder(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form
      if (!newOrder.item.name || !newOrder.item.price) {
        setError('Name and price are required');
        return;
      }

      const orderData = {
        ...newOrder,
        item: {
          ...newOrder.item,
          price: parseFloat(newOrder.item.price)
        }
      };

      if (navigator.onLine) {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });

        if (!response.ok) throw new Error('Failed to create order');
        
        // Refresh orders list
        fetchOrders();
      } else {
        // Offline handling
        const offlineOrder = {
          ...orderData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        const currentOrders = JSON.parse(localStorage.getItem('orders')) || [];
        const updatedOrders = [...currentOrders, offlineOrder];
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
      }

      // Reset form
      setNewOrder({
        item: { name: '', price: '', description: '' },
        status: 'pending'
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      
      <div className="mb-4">
        <span className={`inline-block px-2 py-1 rounded text-sm ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isOnline ? 'Online' : 'Offline'} Mode
        </span>
      </div>

      {/* Order Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Order</h2>
        
        <div className="grid gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <input
              type="text"
              name="item.name"
              value={newOrder.item.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              name="item.price"
              value={newOrder.item.price}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="item.description"
              value={newOrder.item.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              name="status"
              value={newOrder.status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Order
        </button>
      </form>

      {/* Orders List */}
      {loading ? (
        <div className="p-4">Loading...</div>
      ) : orders.length === 0 ? (
        <p>No orders yet</p>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div key={order._id} className="border p-4 rounded-lg shadow-sm">
              <p className="font-semibold">{order.item.name}</p>
              <p className="text-gray-600">{order.item.description}</p>
              <p className="text-sm">${order.item.price}</p>
              <p className="mt-2 text-sm">
                Status: <span className="font-medium">{order.status}</span>
              </p>
              <p className="text-xs text-gray-500">
                Created: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}