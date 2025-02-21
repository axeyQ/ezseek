import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const SalesPrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // Get predictions for next 7 days
      const nextWeek = Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        date: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toLocaleDateString()
      }));

      const results = await Promise.all(
        nextWeek.map(async ({ day, date }) => {
          const response = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day })
          });
          const data = await response.json();
          return {
            date,
            prediction: parseFloat(data.prediction.toFixed(2))
          };
        })
      );

      setPredictions(results);
    } catch (err) {
      setError('Failed to fetch predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Sales Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <button
          onClick={fetchPredictions}
          disabled={loading}
          className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? 'Loading...' : 'Get Next Week Predictions'}
        </button>

        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}

        {predictions.length > 0 && (
          <div className="h-64">
            <LineChart width={800} height={250} data={predictions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="prediction" 
                stroke="#8884d8" 
                name="Predicted Sales"
              />
            </LineChart>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SalesPrediction;