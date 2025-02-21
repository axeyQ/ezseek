'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

export default function CustomerForm({ customer, onSubmit, onClose }) {
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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      onClose();
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

  const dietaryRestrictions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 
    'Dairy-Free', 'Nut Allergy', 'Halal'
  ];

  const paymentMethods = [
    'Cash', 'Credit Card', 'Debit Card', 
    'UPI', 'Online Wallet'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="float-right"
            >
              ×
            </button>
          </div>
        )}

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
                <FaPlus className="inline mr-1" /> Add Address
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
                        <FaTrash />
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

          {/* Preferences */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
            <div className="flex flex-wrap gap-2">
              {dietaryRestrictions.map(restriction => (
                <label key={restriction} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.preferences.dietaryRestrictions.includes(restriction)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        preferences: {
                          ...prev.preferences,
                          dietaryRestrictions: e.target.checked
                            ? [...prev.preferences.dietaryRestrictions, restriction]
                            : prev.preferences.dietaryRestrictions.filter(r => r !== restriction)
                        }
                      }));
                    }}
                    className="mr-2"
                  />
                  {restriction}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Preferred Payment Method
            </label>
            <select
              value={formData.preferences.preferredPaymentMethod}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  preferredPaymentMethod: e.target.value
                }
              }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
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

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {customer ? 'Update Customer' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}