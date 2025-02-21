'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaUser } from 'react-icons/fa';

export default function CustomerLookup({ onSelectCustomer, onCreateCustomer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [searchTerm]);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customers/search?q=${searchTerm}`);
      if (!response.ok) throw new Error('Failed to search customers');
      const data = await response.json();
      setCustomers(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer) => {
    onSelectCustomer(customer);
    setShowResults(false);
    setSearchTerm('');
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full p-2 pl-10 border rounded"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <button
          onClick={onCreateCustomer}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
        >
          <FaPlus className="mr-2" /> New Customer
        </button>
      </div>

      {showResults && (searchTerm.length >= 2) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : customers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No customers found</div>
          ) : (
            <div className="divide-y">
              {customers.map(customer => (
                <div
                  key={customer._id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleSelect(customer)}
                >
                  <FaUser className="text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-600">{customer.phone}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}