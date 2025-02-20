'use client';

import { useState, useEffect } from 'react';

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    isAvailable: true
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/menu');
      if (!response.ok) throw new Error('Failed to fetch menu');
      const data = await response.json();
      setMenuItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newItem.name || !newItem.description || !newItem.price) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price)
        }),
      });

      if (!response.ok) throw new Error('Failed to create menu item');
      
      // Refresh menu list
      fetchMenu();
      
      // Reset form
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: 'main',
        isAvailable: true
      });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Menu Management</h1>

      {/* Add Menu Item Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Add New Menu Item</h2>
        
        <div className="grid gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={newItem.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              name="description"
              value={newItem.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              rows="3"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price *</label>
            <input
              type="number"
              name="price"
              value={newItem.price}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={newItem.category}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="appetizer">Appetizer</option>
              <option value="main">Main Course</option>
              <option value="dessert">Dessert</option>
              <option value="beverage">Beverage</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isAvailable"
              checked={newItem.isAvailable}
              onChange={handleInputChange}
              className="mr-2"
            />
            <label className="text-sm font-medium">Available</label>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm mb-4">{error}</div>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Menu Item
        </button>
      </form>

      {/* Menu Items List */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div key={item._id} className="border p-4 rounded-lg">
              <h2 className="text-xl font-semibold">{item.name}</h2>
              <p className="text-gray-600">{item.description}</p>
              <p className="text-green-600 font-bold">${item.price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">Category: {item.category}</p>
              <p className="text-sm">
                Status: 
                <span className={item.isAvailable ? 'text-green-600' : 'text-red-600'}>
                  {item.isAvailable ? ' Available' : ' Not Available'}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}