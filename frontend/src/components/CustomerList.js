'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaUserPlus, FaEdit, FaTrash, FaStar } from 'react-icons/fa';
import CustomerForm from './CustomerForm';
import Link from 'next/link';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        search: searchTerm
      });

      const response = await fetch(`/api/customers?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data.customers);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomer = async (customerData) => {
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
        body: JSON.stringify(customerData),
      });

      if (!response.ok) throw new Error('Failed to save customer');

      await fetchCustomers();
      setShowForm(false);
      setEditingCustomer(null);
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

  const getLoyaltyTierColor = (spent) => {
    if (spent >= 1000) return 'text-purple-600';
    if (spent >= 500) return 'text-yellow-600';
    if (spent >= 200) return 'text-gray-600';
    return 'text-blue-600';
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          <FaUserPlus className="mr-2" />
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
        <CustomerForm
          customer={editingCustomer}
          onSubmit={handleSaveCustomer}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
        />
      )}

      {/* Customers List */}
      {loading ? (
        <div className="text-center py-10">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No customers found
        </div>
      ) : (
        <div className="grid gap-6">
          {customers.map(customer => (
            <div key={customer._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <Link 
                    href={`/customers/${customer._id}`}
                    className="text-xl font-semibold hover:text-blue-500"
                  >
                    {customer.name}
                  </Link>
                  <div className="text-gray-600">{customer.phone}</div>
                  {customer.email && (
                    <div className="text-gray-500 text-sm">{customer.email}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCustomer(customer);
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
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Total Orders</div>
                  <div className="font-semibold">{customer.totalOrders}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Total Spent</div>
                  <div className="font-semibold">
                    ${customer.totalSpent?.toFixed(2)}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Loyalty Points</div>
                  <div className="font-semibold">
                    {customer.loyaltyPoints}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm text-gray-500">Loyalty Tier</div>
                  <div className={`font-semibold flex items-center ${
                    getLoyaltyTierColor(customer.totalSpent)
                  }`}>
                    <FaStar className="mr-1" />
                    {customer.totalSpent >= 1000 ? 'Platinum' :
                     customer.totalSpent >= 500 ? 'Gold' :
                     customer.totalSpent >= 200 ? 'Silver' :
                     'Bronze'}
                  </div>
                </div>
              </div>

              {/* Latest Order */}
              {customer.lastOrderDate && (
                <div className="mt-4 text-sm text-gray-500">
                  Last Order: {new Date(customer.lastOrderDate).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}