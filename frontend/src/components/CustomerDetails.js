'use client';

import { useState, useEffect } from 'react';
import { 
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaStar, FaHistory, FaEdit, FaTrash 
} from 'react-icons/fa';
import CustomerForm from './CustomerForm';

export default function CustomerDetails({ customerId }) {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'orders', 'addresses'
  const [orderFilters, setOrderFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    endDate: new Date(),
    status: 'all'
  });

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrderHistory();
    }
  }, [activeTab, orderFilters]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/${customerId}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      const data = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    try {
      const queryParams = new URLSearchParams({
        startDate: orderFilters.startDate.toISOString(),
        endDate: orderFilters.endDate.toISOString(),
        status: orderFilters.status
      });

      const response = await fetch(
        `/api/customers/${customerId}/orders?${queryParams}`
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCustomerUpdate = async (updatedData) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) throw new Error('Failed to update customer');

      const data = await response.json();
      setCustomer(data);
      setShowEditForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const getLoyaltyTierInfo = () => {
    const tiers = [
      { name: 'Bronze', min: 0, max: 199 },
      { name: 'Silver', min: 200, max: 499 },
      { name: 'Gold', min: 500, max: 999 },
      { name: 'Platinum', min: 1000, max: Infinity }
    ];

    const currentTier = tiers.find(tier => 
      customer.totalSpent >= tier.min && customer.totalSpent < tier.max
    );

    const nextTier = tiers[tiers.indexOf(currentTier) + 1];
    
    return {
      current: currentTier.name,
      next: nextTier?.name,
      progress: nextTier 
        ? ((customer.totalSpent - currentTier.min) / (nextTier.min - currentTier.min)) * 100
        : 100
    };
  };

  if (loading) return <div className="p-4">Loading customer details...</div>;
  if (!customer) return <div className="p-4">Customer not found</div>;

  const loyaltyInfo = getLoyaltyTierInfo();

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            <FaUser className="mr-2" />
            {customer.name}
          </h1>
          <div className="text-gray-600 mt-1">
            <div className="flex items-center">
              <FaPhone className="mr-2" />
              {customer.phone}
            </div>
            {customer.email && (
              <div className="flex items-center mt-1">
                <FaEnvelope className="mr-2" />
                {customer.email}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowEditForm(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FaEdit className="mr-2" />
            Edit Customer
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 ${
              activeTab === 'overview' 
                ? 'border-b-2 border-blue-500 text-blue-500' 
                : 'text-gray-500'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 ${
              activeTab === 'orders' 
                ? 'border-b-2 border-blue-500 text-blue-500' 
                : 'text-gray-500'
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`py-2 px-4 ${
              activeTab === 'addresses' 
                ? 'border-b-2 border-blue-500 text-blue-500' 
                : 'text-gray-500'
            }`}
          >
            Addresses
          </button>
        </nav>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {/* Content Sections */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Customer Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-500">Total Orders</div>
                <div className="text-xl font-bold">{customer.totalOrders}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-500">Total Spent</div>
                <div className="text-xl font-bold">
                  ${customer.totalSpent?.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-500">Loyalty Points</div>
                <div className="text-xl font-bold">{customer.loyaltyPoints}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <div className="text-sm text-gray-500">Average Order Value</div>
                <div className="text-xl font-bold">
                  ${customer.totalOrders 
                    ? (customer.totalSpent / customer.totalOrders).toFixed(2)
                    : '0.00'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Loyalty Status</h2>
            <div className="flex items-center gap-2 mb-4">
              <FaStar className="text-yellow-500" />
              <span className="font-medium">{loyaltyInfo.current} Member</span>
            </div>
            {loyaltyInfo.next && (
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  Progress to {loyaltyInfo.next}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${loyaltyInfo.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            {customer.preferences?.dietaryRestrictions?.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">
                  Dietary Restrictions
                </div>
                <div className="flex flex-wrap gap-2">
                  {customer.preferences.dietaryRestrictions.map(restriction => (
                    <span 
                      key={restriction}
                      className="px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {restriction}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {customer.preferences?.preferredPaymentMethod && (
              <div>
                <div className="text-sm text-gray-500 mb-2">
                  Preferred Payment Method
                </div>
                <div className="font-medium">
                  {customer.preferences.preferredPaymentMethod}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Notes</h2>
              <p className="text-gray-600">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Order History Tab */}
      {activeTab === 'orders' && (
        <div>
          {/* Order Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Date Range
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={orderFilters.startDate.toISOString().split('T')[0]}
                    onChange={(e) => setOrderFilters(prev => ({
                      ...prev,
                      startDate: new Date(e.target.value)
                    }))}
                    className="border rounded p-1"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={orderFilters.endDate.toISOString().split('T')[0]}
                    onChange={(e) => setOrderFilters(prev => ({
                      ...prev,
                      endDate: new Date(e.target.value)
                    }))}
                    className="border rounded p-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 mb-1">
                  Status
                </label>
                <select
                  value={orderFilters.status}
                  onChange={(e) => setOrderFilters(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                  className="border rounded p-1"
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
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Order #{order._id.slice(-6)}
                      </span>
                      <span className={`px-2 py-1 rounded text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        order.status === 'delivered' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    ${order.totalAmount.toFixed(2)}
                  </div>
                </div>

                <div className="mt-4">
                  {order.items.map((item, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center py-2 border-t first:border-t-0"
                    >
                      <div>
                        <span className="font-medium">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        {item.notes && (
                          <div className="text-sm text-gray-500">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                      <div>${(item.price * item.quantity)}</div>
                      <div>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                {order.specialInstructions && (
                  <div className="mt-4 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Special Instructions: </span>
                    {order.specialInstructions}
                  </div>
                )}

                {order.deliveryAddress && (
                  <div className="mt-4 text-sm">
                    <span className="font-medium">Delivery Address: </span>
                    {`${order.deliveryAddress.street}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state} ${order.deliveryAddress.zipCode}`}
                  </div>
                )}
              </div>
            ))}

            {orders.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No orders found for the selected period
              </div>
            )}
          </div>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="grid gap-6">
          {customer.addresses.map((address, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">
                      {address.type} Address
                    </span>
                    {address.isDefault && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="text-gray-600 mt-2">
                    {address.street}
                  </div>
                  <div className="text-gray-600">
                    {address.city}, {address.state} {address.zipCode}
                  </div>
                  {address.landmark && (
                    <div className="text-sm text-gray-500 mt-1">
                      Landmark: {address.landmark}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Implement edit address functionality
                      setEditingAddress(address);
                      setShowAddressForm(true);
                    }}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <FaEdit />
                  </button>
                  {!address.isDefault && (
                    <button
                      onClick={() => {
                        // Implement delete address functionality
                        handleDeleteAddress(index);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              // Implement add address functionality
              setEditingAddress(null);
              setShowAddressForm(true);
            }}
            className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:text-blue-500"
          >
            <FaPlus className="mr-2" />
            Add New Address
          </button>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditForm && (
        <CustomerForm
          customer={customer}
          onSubmit={handleCustomerUpdate}
          onClose={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
}