'use client';

import { useState, useEffect } from 'react';

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    capacity: '',
    status: 'available',
    location: 'indoor'
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTable(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newTable.tableNumber || !newTable.capacity) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTable,
          tableNumber: parseInt(newTable.tableNumber),
          capacity: parseInt(newTable.capacity)
        }),
      });

      if (!response.ok) throw new Error('Failed to create table');
      
      fetchTables();
      setNewTable({
        tableNumber: '',
        capacity: '',
        status: 'available',
        location: 'indoor'
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      const response = await fetch(`/api/tables?id=${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update table status');
      fetchTables();
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      reserved: 'bg-yellow-100 text-yellow-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Table Management</h1>

      {/* Add Table Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add New Table</h2>
        
        <div className="grid gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Table Number *</label>
            <input
              type="number"
              name="tableNumber"
              value={newTable.tableNumber}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacity *</label>
            <input
              type="number"
              name="capacity"
              value={newTable.capacity}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              name="location"
              value={newTable.location}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="balcony">Balcony</option>
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
          Add Table
        </button>
      </form>

      {/* Tables List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((table) => (
            <div key={table._id} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold">Table {table.tableNumber}</h2>
              <p className="text-gray-600">Capacity: {table.capacity} people</p>
              <p className="text-gray-600">Location: {table.location}</p>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-sm ${getStatusColor(table.status)}`}>
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </span>
              </div>
              
              {/* Status Change Buttons */}
              <div className="mt-4 space-x-2">
                <select
                  value={table.status}
                  onChange={(e) => handleStatusChange(table._id, e.target.value)}
                  className="p-1 border rounded text-sm"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="reserved">Reserved</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}