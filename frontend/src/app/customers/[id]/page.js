'use client';

import { useState, useEffect } from 'react';
import { 
  FaPhone, FaEnvelope, FaLocationArrow, 
  FaHistory, FaFilter, FaCalendar 
} from 'react-icons/fa';

export default function CustomerDetails({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date()
  });
  const [orderStatus, setOrderStatus] = useState('all');

  useEffect(() => {
    fetchCustomerDetails();
    fetchCustomerOrders();
  }, [customerId, dateRange, orderStatus]);

  const fetchCustomerDetails = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCustomerOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        status: orderStatus
      });

      const response = await fetch(
        `/api/customers/${customerId}/orders?${queryParams}`
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      delivered: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="p-4">Loading customer details...</div>;
  if (!customer) return <div className="p-4">Customer not found</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Customer Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">{customer.name}</h1>
            <div className="flex items-center text-gray-600 mb-1">
              <FaPhone className="mr-2" />
              {customer.phone}
            </div>
            {customer.email && (
              <div className="flex items-center text-gray-600">
                <FaEnvelope className="mr-2" />
                {customer.email}
              </div>
            )}
          </div>

          <div className="text-right">
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm text-gray-600">Loyalty Points</div>
              <div className="text-2xl font-bold text-blue-600">
                {customer.loyaltyPoints}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Total Orders</div>
            <div className="text-xl font-bold">{customer.totalOrders}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Total Spent</div>
            <div className="text-xl font-bold">
              ${customer.totalSpent?.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-sm text-gray-600">Last Order</div>
            <div className="text-xl font-bold">
              {customer.lastOrderDate ? 
                new Date(customer.lastOrderDate).toLocaleDateString() : 
                'No orders yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Order History Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <FaHistory className="mr-2" />
            Order History
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-gray-400" />
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  start: new Date(e.target.value)
                }))}
                className="border rounded p-1"
              />
              <span>to</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  end: new Date(e.target.value)
                }))}
                className="border rounded p-1"
              />
            </div>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="border rounded p-2"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No orders found for the selected period
            </div>
          ) : (
            orders.map(order => (
              <div key={order._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Order #{order._id.slice(-6)}</span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        getOrderStatusColor(order.status)
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${order.totalAmount.toFixed(2)}</div>
                    {order.type === 'delivery' && order.deliveryAddress && (
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <FaLocationArrow className="mr-1" />
                        {order.deliveryAddress}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menuItem.name}
                          {item.notes && (
                            <span className="text-gray-500 ml-2">
                              ({item.notes})
                            </span>
                          )}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}