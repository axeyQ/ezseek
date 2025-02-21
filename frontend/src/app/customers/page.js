'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrash, FaLocationArrow, FaStar } from 'react-icons/fa';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    addresses: [{
      type: 'home',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: '',
      isDefault: true
    }],
    notes: '',
    preferences: {
      dietaryRestrictions: [],
      preferredPaymentMethod: ''
    }
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingCustomer 
        ? `/api/customers/${editingCustomer._id}`
        : '/api/customers';
        
      const method = editingCustomer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save customer');

      await fetchCustomers();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete customer');

      await fetchCustomers();
    } catch (err) {
      setError(err.message);
    }
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [
        ...prev.addresses,
        {
          type: 'home',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          landmark: '',
          isDefault: false
        }
      ]
    }));
  };

  const removeAddress = (index) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const updateAddress = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.map((addr, i) => 
        i === index ? { ...addr, [field]: value } : addr
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      addresses: [{
        type: 'home',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        isDefault: true
      }],
      notes: '',
      preferences: {
        dietaryRestrictions: [],
        preferredPaymentMethod: ''
      }
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-4">Loading customers...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Customer
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      phone: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Addresses */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Addresses</label>
                  <button
                    type="button"
                    onClick={addAddress}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    + Add Address
                  </button>
                </div>

                {formData.addresses.map((address, index) => (
                  <div key={index} className="border p-4 rounded mb-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                          value={address.type}
                          onChange={(e) => updateAddress(index, 'type', e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={address.isDefault}
                            onChange={(e) => updateAddress(index, 'isDefault', e.target.checked)}
                            className="mr-2"
                          />
                          Default Address
                        </label>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeAddress(index)}
                            className="ml-4 text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">Street</label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => updateAddress(index, 'street', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">City</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => updateAddress(index, 'city', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">State</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => updateAddress(index, 'state', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">ZIP Code</label>
                        <input
                          type="text"
                          value={address.zipCode}
                          onChange={(e) => updateAddress(index, 'zipCode', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Landmark</label>
                        <input
                          type="text"
                          value={address.landmark}
                          onChange={(e) => updateAddress(index, 'landmark', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map(customer => (
          <div key={customer._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{customer.name}</h3>
                <p className="text-gray-600">{customer.phone}</p>
                {customer.email && (
                  <p className="text-gray-600 text-sm">{customer.email}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCustomer(customer);
                    setFormData({
                      ...customer,
                      addresses: customer.addresses.length > 0 ? 
                        customer.addresses : 
                        [{ type: 'home', street: '', city: '', state: '', zipCode: '', landmark: '', isDefault: true }]
                    });
                    setShowForm(true);
                  }}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(customer._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                >
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Customer Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="font-medium">Orders</div>
                <div>{customer.totalOrders}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="font-medium">Spent</div>
                <div>${customer.totalSpent?.toFixed(2)}</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="font-medium">Points</div>
                <div>{customer.loyaltyPoints}</div>
              </div>
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              {customer.addresses.map((address, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded text-sm ${
                    address.isDefault ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center">
                      <FaLocationArrow className="text-gray-400 mr-2" />
                      <span className="capitalize">{address.type}</span>
                    </div>
                    {address.isDefault && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-gray-600">
                    {address.street}, {address.city}, {address.state} {address.zipCode}
                  </div>
                  {address.landmark && (
                    <div className="text-gray-500 text-xs mt-1">
                      Landmark: {address.landmark}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            {customer.notes && (
              <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {customer.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}