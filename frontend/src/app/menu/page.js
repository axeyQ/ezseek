'use client';

import { useState, useEffect } from 'react';

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'main',
    isAvailable: true,
    preparationTime: '',
    ingredients: [''],
    spiceLevel: 'mild',
    isVegetarian: false,
    allergens: []
  });

  useEffect(() => {
    fetchMenuItems();
  }, []);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        price: editingItem.price.toString(),
        preparationTime: editingItem.preparationTime?.toString() || '',
      });
      setShowForm(true);
    }
  }, [editingItem]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/menu');
      if (!response.ok) throw new Error('Failed to fetch menu items');
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleIngredientChange = (index, value) => {
    setFormData(prev => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = value;
      return { ...prev, ingredients: updatedIngredients };
    });
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleAllergenToggle = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'main',
      isAvailable: true,
      preparationTime: '',
      ingredients: [''],
      spiceLevel: 'mild',
      isVegetarian: false,
      allergens: []
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.price) {
        setError('Name and price are required');
        return;
      }

      const url = editingItem 
        ? `/api/menu?id=${editingItem._id}`
        : '/api/menu';

      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          preparationTime: parseInt(formData.preparationTime)
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingItem ? 'update' : 'create'} menu item`);
      
      await fetchMenuItems();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/menu?id=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete menu item');
      
      await fetchMenuItems();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
  };

  if (loading) return <div className="p-4">Loading menu items...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add New Item
          </button>
        )}
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

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
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
                value={formData.category}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="appetizer">Appetizer</option>
                <option value="main">Main Course</option>
                <option value="dessert">Dessert</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Preparation Time (minutes)</label>
              <input
                type="number"
                name="preparationTime"
                value={formData.preparationTime}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Ingredients</label>
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="flex-1 p-2 border rounded"
                    placeholder="Enter ingredient"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="mt-2 px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                Add Ingredient
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Spice Level</label>
              <select
                name="spiceLevel"
                value={formData.spiceLevel}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="hot">Hot</option>
                <option value="extra-hot">Extra Hot</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isVegetarian"
                checked={formData.isVegetarian}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Vegetarian</label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Allergens</label>
              <div className="flex flex-wrap gap-2">
                {['nuts', 'dairy', 'gluten', 'soy', 'eggs', 'shellfish'].map(allergen => (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => handleAllergenToggle(allergen)}
                    className={`px-3 py-1 rounded border ${
                      formData.allergens.includes(allergen)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white'
                    }`}
                  >
                    {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
            >
              {editingItem ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item._id} className="bg-white p-6 rounded-lg shadow-sm relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item._id)}
                className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
              >
                Delete
              </button>
            </div>

            <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
            <p className="text-gray-600 mb-2">{item.description}</p>
            <p className="text-green-600 font-bold mb-2">${item.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mb-2">Category: {item.category}</p>
            
            {item.preparationTime && (
              <p className="text-sm text-gray-500 mb-2">
                Prep Time: {item.preparationTime} mins
              </p>
            )}
            
            {item.ingredients?.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium">Ingredients:</p>
                <p className="text-sm text-gray-600">
                  {item.ingredients.join(', ')}
                </p>
              </div>
            )}
            
            {item.allergens?.length > 0 && (
              <div className="mb-2">
                <p className="text-sm font-medium">Allergens:</p>
                <div className="flex flex-wrap gap-1">
                  {item.allergens.map(allergen => (
                    <span
                      key={allergen}
                      className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                    >
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-4">
              {item.isVegetarian && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Vegetarian
                </span>
              )}
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                {item.spiceLevel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}