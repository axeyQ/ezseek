'use client';
import { useState, useEffect } from 'react';
import CustomerLookup from '@/components/CustomerLookup';
import CustomerForm from '@/components/CustomerForm';

export default function SalesRegister() {
  const [activeTab, setActiveTab] = useState('new-order');
  const [menuItems, setMenuItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [orderType, setOrderType] = useState('dine-in');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    specialInstructions: '',
    discountType: 'none',
    discountValue: 0
  });

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [menuResponse, tableResponse] = await Promise.all([
          fetch('/api/menu'),
          fetch('/api/tables')
        ]);

        if (!menuResponse.ok || !tableResponse.ok) {
          throw new Error('Failed to fetch initial data');
        }

        const menuData = await menuResponse.json();
        const tableData = await tableResponse.json();

        setMenuItems(menuData);
        setTables(tableData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Calculate totals (subtotal, tax, discount, total)
  const calculateTotal = () => {
    const subtotal = currentOrder.items.reduce((sum, item) => 
      sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
    );

    const tax = subtotal * 0.10; // 10% tax

    let discount = 0;
    if (currentOrder.discountType === 'percentage' && currentOrder.discountValue) {
      discount = (subtotal * parseFloat(currentOrder.discountValue)) / 100;
    } else if (currentOrder.discountType === 'fixed' && currentOrder.discountValue) {
      discount = parseFloat(currentOrder.discountValue);
    }

    const total = subtotal + tax - discount;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      discount: discount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  // Handle adding item to order
  const addItemToOrder = (menuItem) => {
    setCurrentOrder(prev => {
      const existingItem = prev.items.find(item => item.menuItem === menuItem._id);
      
      if (existingItem) {
        return {
          ...prev,
          items: prev.items.map(item =>
            item.menuItem === menuItem._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        };
      }

      return {
        ...prev,
        items: [...prev.items, {
          menuItem: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1
        }]
      };
    });
  };

  // Handle removing item from order
  const removeItemFromOrder = (index) => {
    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Handle quantity change
  const updateItemQuantity = (index, quantity) => {
    const newQuantity = parseInt(quantity);
    if (newQuantity < 1) return;

    setCurrentOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, quantity: newQuantity } : item
      )
    }));
  };

  // Handle table selection
  const handleTableSelect = (table) => {
    setSelectedTable(table);
  };

  // Handle discount change
  const handleDiscountChange = (type, value) => {
    setCurrentOrder(prev => ({
      ...prev,
      discountType: type,
      discountValue: value
    }));
  };

  // Handle order submission
  const handleOrderSubmit = async () => {
    try {
      if (!selectedCustomer) {
        setError('Please select a customer');
        return;
      }

      if (currentOrder.items.length === 0) {
        setError('Please add items to the order');
        return;
      }

      if (orderType === 'dine-in' && !selectedTable) {
        setError('Please select a table');
        return;
      }

      const totals = calculateTotal();
      
      const orderData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.fullName,
        customerPhone: selectedCustomer.phone,
        items: currentOrder.items.map(item => ({
          menuItem: item.menuItem,
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          name: item.name
        })),
        orderType,
        tableId: orderType === 'dine-in' ? selectedTable._id : null,
        specialInstructions: currentOrder.specialInstructions,
        totalAmount: parseFloat(totals.total),
        discountType: currentOrder.discountType,
        discountValue: currentOrder.discountValue
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate-bill',
          orderData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const result = await response.json();
      setShowPaymentModal(true);
      setCurrentOrder({
        ...result,
        items: currentOrder.items
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Payment Modal Component
  const PaymentModal = ({ onClose }) => {
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [amount, setAmount] = useState(calculateTotal().total);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const handlePayment = async () => {
      try {
        setProcessing(true);
        const response = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'process-payment',
            orderId: currentOrder._id,
            paymentDetails: {
              method: paymentMethod,
              amount: parseFloat(amount)
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment failed');
        }

        // Reset form and close modal
        setCurrentOrder({
          items: [],
          specialInstructions: '',
          discountType: 'none',
          discountValue: 0
        });
        setSelectedCustomer(null);
        setSelectedTable(null);
        onClose();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };

    const orderTotals = calculateTotal();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold mb-4">Process Payment</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Order Summary</label>
            <div className="bg-gray-50 p-2 rounded">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Bill Amount</label>
            <div className="text-xl font-bold">₹{orderTotals.total}</div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Amount Received</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded"
              step="0.01"
              min={orderTotals.total}
            />
          </div>

          {paymentMethod === 'cash' && parseFloat(amount) > parseFloat(orderTotals.total) && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Change</label>
              <div className="text-lg font-semibold">
                ₹{(parseFloat(amount) - parseFloat(orderTotals.total)).toFixed(2)}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing || parseFloat(amount) < parseFloat(orderTotals.total)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {processing ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-4">Loading...</div>;

  const orderTotals = calculateTotal();

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Register</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('new-order')}
            className={`px-4 py-2 rounded ${
              activeTab === 'new-order' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            New Order
          </button>
          <button
            onClick={() => setActiveTab('active-orders')}
            className={`px-4 py-2 rounded ${
              activeTab === 'active-orders' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            Active Orders
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Order Details */}
        <div>
          {/* Customer Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
            <CustomerLookup
              onSelectCustomer={setSelectedCustomer}
              onCreateCustomer={() => setShowCustomerForm(true)}
            />
            {selectedCustomer && (
              <div className="mt-2 p-3 bg-blue-50 rounded">
                <div className="font-medium">{selectedCustomer.fullName}</div>
                <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
              </div>
            )}
          </div>

          {/* Order Type Selection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Order Type</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setOrderType('dine-in')}
                className={`px-4 py-2 rounded ${
                  orderType === 'dine-in' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Dine In
              </button>
              <button
                onClick={() => setOrderType('takeaway')}
                className={`px-4 py-2 rounded ${
                  orderType === 'takeaway' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>

          {/* Table Selection */}
          {orderType === 'dine-in' && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Select Table</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {tables.map(table => (
                  <button
                    key={table._id}
                    onClick={() => handleTableSelect(table)}
                    disabled={table.status === 'occupied'}
                    className={`p-3 rounded border ${
                      selectedTable?._id === table._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    } ${
                      table.status === 'occupied'
                        ? 'bg-red-50 cursor-not-allowed'
                        : 'hover:border-blue-500'
                    }`}
                  >
                    <div className="font-medium">Table {table.tableNumber}</div>
                    <div className="text-sm text-gray-500">Capacity: {table.capacity}
                    </div>
                    <div className={`text-sm ${
                      table.status === 'occupied' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {table.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Special Instructions</h2>
            <textarea
              value={currentOrder.specialInstructions}
              onChange={(e) => setCurrentOrder(prev => ({
                ...prev,
                specialInstructions: e.target.value
              }))}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Enter any special instructions..."
            />
          </div>
        </div>

        {/* Right Column - Menu Items and Order Summary */}
        <div>
          {/* Menu Items */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Menu Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {menuItems.map(item => (
                <button
                  key={item._id}
                  onClick={() => addItemToOrder(item)}
                  className="p-3 border rounded hover:bg-gray-50 text-left"
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">₹{item.price}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border rounded p-4">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            {/* Order Items */}
            <div className="space-y-2 mb-4">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">₹{item.price} × {item.quantity}</div>
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
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Discount</label>
              <div className="flex gap-2">
                <select
                  value={currentOrder.discountType}
                  onChange={(e) => handleDiscountChange(e.target.value, currentOrder.discountValue)}
                  className="p-2 border rounded"
                >
                  <option value="none">No Discount</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                {currentOrder.discountType !== 'none' && (
                  <input
                    type="number"
                    min="0"
                    value={currentOrder.discountValue}
                    onChange={(e) => handleDiscountChange(currentOrder.discountType, e.target.value)}
                    className="w-24 p-2 border rounded"
                    placeholder="Value"
                  />
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Subtotal</span>
                <span>₹{orderTotals.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span>Tax</span>
                <span>₹{orderTotals.tax}</span>
              </div>
              {parseFloat(orderTotals.discount) > 0 && (
                <div className="flex justify-between text-sm mb-1 text-red-600">
                  <span>Discount</span>
                  <span>-₹{orderTotals.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2">
                <span>Total</span>
                <span>₹{orderTotals.total}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handleOrderSubmit}
              disabled={currentOrder.items.length === 0}
              className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              Place Order
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          onClose={() => setShowCustomerForm(false)}
          onSave={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerForm(false);
          }}
        />
      )}
    </div>
  );
}