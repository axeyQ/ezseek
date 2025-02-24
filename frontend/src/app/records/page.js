'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export default function OrderRecords() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'), // Last 30 days
    endDate: format(new Date(), 'yyyy-MM-dd'),
    orderType: 'all',
    status: 'all',
    searchQuery: ''
  });

  // Fetch orders based on filters
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
          orderType: filters.orderType,
          status: filters.status,
          search: filters.searchQuery
        });

        const response = await fetch(`/api/orders/history?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch orders');

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Export orders to CSV
  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Type', 'Items', 'Total', 'Status'];
    const csvData = orders.map(order => [
      order._id,
      format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
      order.customerName,
      order.orderType,
      order.items.map(item => `${item.quantity}x ${item.name}`).join(', '),
      `₹${order.totalAmount.toFixed(2)}`,
      order.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orders_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    link.click();
  };

  if (loading) return <div className="p-4">Loading order records...</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Order Records</h1>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export to CSV
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order Type</label>
            <select
              value={filters.orderType}
              onChange={(e) => handleFilterChange('orderType', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Types</option>
              <option value="dine-in">Dine In</option>
              <option value="takeaway">Takeaway</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              placeholder="Search orders..."
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

 {/* Orders Table */}
 <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order._id ? order._id.slice(-6) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customerName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.orderType || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
  {(order.items || []).map((item, index) => (
    <div key={index} className="flex items-center gap-1">
      <span>{item.quantity}x</span>
      <span>
        {item.name || // Try to get the name directly
          item.menuItem?.name || // Try to get it from menuItem if populated
          'Unknown Item'} {/* Fallback if neither exists */}
      </span>
    </div>
  ))}
</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{typeof order.totalAmount === 'number' ? order.totalAmount.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => {/* Handle view details */}}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}