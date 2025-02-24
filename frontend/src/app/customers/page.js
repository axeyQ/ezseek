'use client';
import { useState, useEffect } from 'react';
import { Search, Phone, MapPin, Plus, Edit2, UserPlus } from 'lucide-react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLedgerForm, setShowLedgerForm] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    alternateNumber: '',
    addresses: [{
      street: '',
      city: '',
      state: '',
      zipCode: '',
      landmark: '',
      isDefault: true
    }]
  });

  const [ledgerData, setLedgerData] = useState({
    advancePayment: 0,
    dueAmount: 0
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (index, field, value) => {
    setFormData(prev => {
      const newAddresses = [...prev.addresses];
      newAddresses[index] = {
        ...newAddresses[index],
        [field]: value
      };
      return {
        ...prev,
        addresses: newAddresses
      };
    });
  };

  const addAddress = () => {
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        isDefault: false
      }]
    }));
  };

  const removeAddress = (index) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = selectedCustomer 
        ? `/api/customers?id=${selectedCustomer._id}`
        : '/api/customers';
      
      const method = selectedCustomer ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save customer');
      
      await fetchCustomers();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLedgerSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/customers?id=${selectedCustomer._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ledgerData)
      });

      if (!response.ok) throw new Error('Failed to update ledger');
      
      await fetchCustomers();
      setShowLedgerForm(false);
      setLedgerData({ advancePayment: 0, dueAmount: 0 });
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      contactNumber: '',
      alternateNumber: '',
      addresses: [{
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        isDefault: true
      }]
    });
    setSelectedCustomer(null);
    setShowForm(false);
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      fullName: customer.fullName,
      contactNumber: customer.contactNumber,
      alternateNumber: customer.alternateNumber || '',
      addresses: customer.addresses.length > 0 ? customer.addresses : [{
        street: '',
        city: '',
        state: '',
        zipCode: '',
        landmark: '',
        isDefault: true
      }]
    });
    setShowForm(true);
  };

  const handleSearch = async () => {
    if (!searchQuery) {
      fetchCustomers();
      return;
    }

    try {
      const response = await fetch(`/api/customers?phone=${searchQuery}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setCustomers(data ? [data] : []);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          <UserPlus size={20} />
          Add New Customer
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
        >
          Search
        </button>
      </div>

      {/* Customer Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alternate Number</label>
                  <input
                    type="tel"
                    name="alternateNumber"
                    value={formData.alternateNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Addresses */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Addresses</h3>
                  <button
                    type="button"
                    onClick={addAddress}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                  >
                    <Plus size={16} /> Add Address
                  </button>
                </div>
                {formData.addresses.map((address, index) => (
                  <div key={index} className="p-4 border rounded mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Street *</label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => handleAddressChange(index, 'street', e.target.value)}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State *</label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => handleAddressChange(index, 'state', e.target.value)}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                        <input
                          type="text"
                          value={address.zipCode}
                          onChange={(e) => handleAddressChange(index, 'zipCode', e.target.value)}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Landmark</label>
                        <input
                          type="text"
                          value={address.landmark}
                          onChange={(e) => handleAddressChange(index, 'landmark', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    </div>
                    {formData.addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAddress(index)}
                        className="mt-2 text-red-500 hover:text-red-600"
                      >
                        Remove Address
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-2">
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
                  {selectedCustomer ? 'Update Customer' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Form */}
      {showLedgerForm && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Customer Ledger</h2>
            <form onSubmit={handleLedgerSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Advance Payment</label>
                  <input
                    type="number"
                    value={ledgerData.advancePayment}
                    onChange={(e) => setLedgerData(prev => ({
                      ...prev,
                      advancePayment: parseFloat(e.target.value)
                    }))}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Amount</label>
                  <input
                    type="number"
                    value={ledgerData.dueAmount}
                    onChange={(e) => setLedgerData(prev => ({
                      ...prev,
                      dueAmount: parseFloat(e.target.value)
                    }))}
                    className="w-full p-2 border rounded"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLedgerForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-10">Loading customers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div key={customer._id} className="bg-white p-6 rounded-lg shadow-sm relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                >
                  <Edit2 size={16} />
                </button>
              </div>

              <h3 className="text-xl font-semibold mb-2">{customer.fullName}</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span>{customer.contactNumber}</span>
                </div>
                {customer.alternateNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{customer.alternateNumber}</span>
                  </div>
                )}
                {customer.addresses?.map((address, index) => (
                  <div key={index} className="flex items-start gap-2 text-gray-600">
                    <MapPin size={16} className="mt-1" />
                    <span className="text-sm">
                      {address.street}, {address.city}, {address.state} {address.zipCode}
                      {address.landmark && ` (${address.landmark})`}
                      {address.isDefault && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Orders</p>
                    <p className="font-semibold">{customer.totalOrders}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Spent</p>
                    <p className="font-semibold">₹{customer.totalOrdersValue?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg. Order Value</p>
                    <p className="font-semibold">₹{customer.averageOrderValue?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Order</p>
                    <p className="font-semibold">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600">Customer Ledger</p>
                    <button
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setShowLedgerForm(true);
                      }}
                      className="text-sm text-blue-500 hover:text-blue-600"
                    >
                      Update
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Advance</p>
                      <p className={`font-semibold ${customer.advancePayment > 0 ? 'text-green-600' : ''}`}>
                        ₹{customer.advancePayment?.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Due Amount</p>
                      <p className={`font-semibold ${customer.dueAmount > 0 ? 'text-red-600' : ''}`}>
                        ₹{customer.dueAmount?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}