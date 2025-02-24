// src/components/SalesPredictionDashboard.js
'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import SalesPrediction from '@/ml/SalesPrediction';

export default function SalesPredictionDashboard() {
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePredictions = async () => {
      try {
        setIsLoading(true);
        
        // Load historical data
        const response = await fetch('/api/sales/historical');
        const historicalData = await response.json();

        // Initialize and train model
        const model = new SalesPrediction();
        await model.train(historicalData);

        // Generate predictions for next 7 days
        const nextWeekPredictions = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
          const predictionDate = new Date(today);
          predictionDate.setDate(today.getDate() + i);
          
          const prediction = await model.predict(predictionDate);
          nextWeekPredictions.push({
            date: predictionDate.toLocaleDateString(),
            predictedSales: prediction
          });
        }

        setPredictions(nextWeekPredictions);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to generate predictions');
        setIsLoading(false);
      }
    };

    initializePredictions();
  }, []);

  if (isLoading) {
    return <div>Loading predictions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Sales Predictions</h2>
      <div className="bg-white p-4 rounded-lg shadow">
        <LineChart width={800} height={400} data={predictions}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="predictedSales" 
            stroke="#8884d8" 
            name="Predicted Sales"
          />
        </LineChart>
      </div>
    </div>
  );
}