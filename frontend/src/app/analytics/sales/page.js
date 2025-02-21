'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function SalesAnalytics() {
  const [timeFrame, setTimeFrame] = useState('daily'); // daily, weekly, monthly
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    end: new Date()
  });
  const [salesData, setSalesData] = useState({
    revenue: [],
    topItems: [],
    ordersByTime: [],
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeFrame, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeFrame,
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch analytics data');
      const data = await response.json();
      setSalesData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sales Analytics</h1>
        
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeFrame('daily')}
              className={`px-4 py-2 rounded ${
                timeFrame === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeFrame('weekly')}
              className={`px-4 py-2 rounded ${
                timeFrame === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeFrame('monthly')}
              className={`px-4 py-2 rounded ${
                timeFrame === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Monthly
            </button>
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                start: new Date(e.target.value)
              }))}
              className="border rounded px-2 py-1"
            />
            <span>to</span>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange(prev => ({
                ...prev,
                end: new Date(e.target.value)
              }))}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right">×</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">Loading analytics data...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData.revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0088FE" 
                  name="Revenue"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#00C49F" 
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Top Selling Items</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.topItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#0088FE" name="Quantity Sold" />
                <Bar dataKey="revenue" fill="#00C49F" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders by Time of Day */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Orders by Time of Day</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData.ordersByTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#FFBB28" name="Number of Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesData.categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {salesData.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}