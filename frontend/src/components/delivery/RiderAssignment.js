// frontend/src/components/delivery/RiderAssignment.js
'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RiderAssignment({ 
  delivery, 
  availableRiders, 
  onAssign 
}) {
  const [selectedRider, setSelectedRider] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedRider) return;

    setLoading(true);
    setError(null);

    try {
      await onAssign(delivery._id, selectedRider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Rider
        </label>
        <select
          value={selectedRider}
          onChange={(e) => setSelectedRider(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2"
          disabled={loading}
        >
          <option value="">Choose a rider</option>
          {availableRiders.map((rider) => (
            <option key={rider._id} value={rider._id}>
              {rider.name} - {rider.deliveriesCompleted} deliveries
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleAssign}
        disabled={!selectedRider || loading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
      >
        {loading ? 'Assigning...' : 'Assign Rider'}
      </button>
    </div>
  );
}