'use client';
import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          startDate: dateRange.start,
          endDate: dateRange.end
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const renderSalesReport = () => {
    if (!reportData || reportData.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Daily Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id.date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalSales" stroke="#0088FE" name="Sales" />
              <Line type="monotone" dataKey="totalOrders" stroke="#00C49F" name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Order Type */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Sales by Order Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData}
                dataKey="totalSales"
                nameKey="_id.orderType"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderItemWiseReport = () => {
    if (!reportData || reportData.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="itemName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalQuantity" fill="#0088FE" name="Quantity Sold" />
              <Bar dataKey="totalRevenue" fill="#00C49F" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category-wise Sales */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Category-wise Sales</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {item.totalQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      ₹{item.totalRevenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderKOTReport = () => {
    if (!reportData || reportData.length === 0) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={reportData}
                dataKey="totalOrders"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {reportData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Average Preparation Time */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Average Preparation Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averagePreparationTime" fill="#0088FE" name="Minutes" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (!reportData || !reportData.analysis) return null;

    const { analysis, topCustomers } = reportData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Overview */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-600">Total Customers</p>
              <p className="text-2xl font-bold">{analysis.totalCustomers}</p>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <p className="text-sm text-green-600">Average Order Value</p>
              <p className="text-2xl font-bold">₹{analysis.averageOrderValue?.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded">
              <p className="text-sm text-purple-600">Total Revenue</p>
              <p className="text-2xl font-bold">₹{analysis.totalRevenue?.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-600">Avg Orders/Customer</p>
              <p className="text-2xl font-bold">{analysis.averageOrdersPerCustomer?.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topCustomers.map((customer, index) => (
                  <tr key={customer._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                      <div className="text-sm text-gray-500">{customer.contactNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {customer.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      ₹{customer.totalOrdersValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border rounded px-3 py-2"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border rounded px-3 py-2"
            />
          </div>
          
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="sales">Sales Report</option>
            <option value="itemwise">Item-wise Sales</option>
            <option value="kot">Kitchen Order Tickets</option>
            <option value="customer">Customer Analysis</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>
          {reportType === 'sales' && renderSalesReport()}
          {reportType === 'itemwise' && renderItemWiseReport()}
          {reportType === 'kot' && renderKOTReport()}
          {reportType === 'customer' && renderCustomerReport()}
        </div>
      )}
    </div>
  );
}