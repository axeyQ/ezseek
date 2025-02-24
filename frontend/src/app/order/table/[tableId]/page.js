'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TableOrder() {
  const router = useRouter();
  const { tableId } = useParams();
  const [table, setTable] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  
  // Use a single state object to prevent unnecessary re-renders
  const [orderState, setOrderState] = useState({
    items: [],
    specialInstructions: '',
    customerInfo: {
      name: '',
      phone: ''
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Calculate total
  const calculateTotal = useCallback(() => {
    return orderState.items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    );
  }, [orderState.items]);

  // Use memoized handlers to prevent recreation on each render
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === 'name' || name === 'phone') {
      setOrderState(prevState => ({
        ...prevState,
        customerInfo: {
          ...prevState.customerInfo,
          [name]: value
        }
      }));
    } else {
      setOrderState(prevState => ({
        ...prevState,
        [name]: value
      }));
    }
  }, []);

  // Add item to order without causing unnecessary re-renders
  const addItemToOrder = useCallback((menuItem) => {
    setOrderState(prevState => {
      const existingItemIndex = prevState.items.findIndex(
        item => item.menuItem === menuItem._id
      );

      if (existingItemIndex !== -1) {
        // Update existing item
        const updatedItems = [...prevState.items];
        updatedItems[existingItemIndex].quantity += 1;
        
        return {
          ...prevState,
          items: updatedItems
        };
      }

      // Add new item
      return {
        ...prevState,
        items: [
          ...prevState.items,
          {
            menuItem: menuItem._id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1
          }
        ]
      };
    });
  }, []);

  // Memoized function for updating item quantity
  const updateItemQuantity = useCallback((index, quantity) => {
    setOrderState(prevState => {
      const updatedItems = [...prevState.items];
      updatedItems[index].quantity = Math.max(1, parseInt(quantity));
      
      return {
        ...prevState,
        items: updatedItems
      };
    });
  }, []);

  // Memoized function for removing items
  const removeItemFromOrder = useCallback((index) => {
    setOrderState(prevState => ({
      ...prevState,
      items: prevState.items.filter((_, i) => i !== index)
    }));
  }, []);

  // Fetch data using a stable reference
  const fetchData = useCallback(async () => {
    try {
      if (!tableId || tableId === 'undefined') {
        throw new Error('Invalid table ID');
      }

      setLoading(true);
      const [tableResponse, menuResponse] = await Promise.all([
        fetch(`/api/tables/${tableId}`),
        fetch('/api/menu')
      ]);

      if (!tableResponse.ok) {
        throw new Error(
          tableResponse.status === 404 ? 'Table not found' : 'Failed to fetch table'
        );
      }

      if (!menuResponse.ok) {
        throw new Error('Failed to fetch menu');
      }

      const tableData = await tableResponse.json();
      const menuData = await menuResponse.json();

      setTable(tableData);
      setMenuItems(menuData);
    } catch (err) {
      setError(err.message);
      if (err.message === 'Invalid table ID') {
        router.push('/404');
      }
    } finally {
      setLoading(false);
    }
  }, [tableId, router]);

  // Use effect with stable dependency
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle order submission
  const handlePlaceOrder = useCallback(async () => {
    try {
      // Validate order
      if (orderState.items.length === 0) {
        setError('Please add items to your order');
        return;
      }

      if (!orderState.customerInfo.name) {
        setError('Please enter your name');
        return;
      }

      if (!orderState.customerInfo.phone) {
        setError('Please enter your phone number');
        return;
      }

      // Validate phone number
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(orderState.customerInfo.phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      // Create order data
      const orderData = {
        tableId,
        items: orderState.items.map(item => ({
          menuItem: item.menuItem,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          name: item.name
        })),
        specialInstructions: orderState.specialInstructions,
        orderType: 'dine-in',
        totalAmount: calculateTotal(),
        customerName: orderState.customerInfo.name,
        customerPhone: orderState.customerInfo.phone
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      // Show success message
      setOrderPlaced(true);
      
      // Reset form after 5 seconds
      setTimeout(() => {
        setOrderState({
          items: [],
          specialInstructions: '',
          customerInfo: {
            name: '',
            phone: ''
          }
        });
        setOrderPlaced(false);
      }, 5000);
    } catch (err) {
      setError(err.message);
    }
  }, [orderState, tableId, calculateTotal]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Loading...</div>
          <div className="text-gray-500">Please wait while we fetch the menu</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2 text-red-600">Error</div>
          <div className="text-gray-700">{error}</div>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Table not found state
  if (!table) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Table Not Found</div>
          <div className="text-gray-500">The requested table could not be found</div>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Table {table.tableNumber}</h1>

      {/* Order Success Message */}
      {orderPlaced && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
          <h2 className="font-bold text-lg">Order Placed Successfully!</h2>
          <p>Your order has been sent to the kitchen.</p>
        </div>
      )}

      {/* Customer Form */}
      <div className="mb-6 border rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-4">Your Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={orderState.customerInfo.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={orderState.customerInfo.phone}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter your 10-digit phone number"
              required
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {menuItems.map(item => (
            <div 
              key={item._id} 
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => addItemToOrder(item)}
            >
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-gray-600">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current Order */}
      <div className="border rounded-lg p-4 bg-white">
        <h2 className="text-xl font-semibold mb-4">Your Order</h2>
        
        {orderState.items.length === 0 ? (
          <p className="text-gray-500">No items in your order</p>
        ) : (
          <>
            {orderState.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between mb-4 pb-2 border-b">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-600 ml-2">₹{item.price}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItemQuantity(index, e.target.value)}
                    className="w-16 p-1 border rounded"
                  />
                  <button
                    onClick={() => removeItemFromOrder(index)}
                    className="text-red-500 px-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Special Instructions</label>
              <textarea
                name="specialInstructions"
                value={orderState.specialInstructions}
                onChange={handleInputChange}
                placeholder="Any special instructions or requests?"
                className="w-full p-2 border rounded mb-4"
                rows="2"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Place Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}