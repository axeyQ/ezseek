// src/app/delivery/page.js
'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { useRouter } from 'next/navigation';

// Utility function for formatting time
function formatTime(minutes) {
  if (!minutes) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// src/app/delivery/page.js - Update DeliveryCard component
function DeliveryCard({ delivery, onSelect, isSelected }) {
    const router = useRouter();
  
    const openTracking = (e) => {
      e.stopPropagation(); // Prevent selection of delivery when clicking track button
      router.push(`/delivery/tracking/${delivery._id}`);
    };
  
    return (
      <div
        className={`p-4 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-blue-50 border-blue-500'
            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
        } border`}
        onClick={onSelect}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">#{delivery.trackingId}</h3>
            <p className="text-sm text-gray-600">{delivery.dropLocation.address}</p>
          </div>
          <StatusBadge status={delivery.status} />
        </div>
        <div className="mt-2 text-sm text-gray-500">
          <p>Rider: {delivery.rider?.name || 'Unassigned'}</p>
          <p>ETA: {formatTime(delivery.estimatedTime)}</p>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={openTracking}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
          >
            Track Delivery
          </button>
        </div>
      </div>
    );
  }
// StatusBadge Component
function StatusBadge({ status }) {
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    PICKED_UP: 'bg-purple-100 text-purple-800',
    IN_TRANSIT: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        statusColors[status]
      }`}
    >
      {status}
    </span>
  );
}

// DeliveryDetails Component
function DeliveryDetails({ delivery, riders, onAssignRider }) {
  const [selectedRider, setSelectedRider] = useState('');

  const handleAssign = async () => {
    if (!selectedRider) return;
    await onAssignRider(delivery._id, selectedRider);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Delivery Details</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">Pickup Location</p>
          <p className="font-medium">{delivery.pickupLocation.address}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Drop Location</p>
          <p className="font-medium">{delivery.dropLocation.address}</p>
        </div>
      </div>

      {!delivery.rider && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Assign Rider
          </label>
          <div className="flex gap-2">
            <select
              value={selectedRider}
              onChange={(e) => setSelectedRider(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 p-2"
            >
              <option value="">Select a rider</option>
              {riders
                .filter((rider) => rider.status === 'AVAILABLE')
                .map((rider) => (
                  <option key={rider._id} value={rider._id}>
                    {rider.name} ({rider.deliveriesCompleted} deliveries)
                  </option>
                ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedRider}
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:bg-gray-300"
            >
              Assign
            </button>
          </div>
        </div>
      )}

      {delivery.rider && (
        <div>
          <p className="text-sm text-gray-500">Assigned Rider</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-800 font-medium">
                {delivery.rider.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{delivery.rider.name}</p>
              <p className="text-sm text-gray-500">{delivery.rider.phoneNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main DeliveryManagement Component
export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch deliveries and riders
    const fetchData = async () => {
      try {
        const [deliveriesRes, ridersRes] = await Promise.all([
          fetch('/api/delivery'),
          fetch('/api/riders')
        ]);

        if (!deliveriesRes.ok || !ridersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const deliveriesData = await deliveriesRes.json();
        const ridersData = await ridersRes.json();

        setDeliveries(deliveriesData);
        setRiders(ridersData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignRider = async (deliveryId, riderId) => {
    try {
      const response = await fetch(`/api/delivery/${deliveryId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riderId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign rider');
      }

      // Refresh delivery data
      fetchData();
    } catch (err) {
      setError('Failed to assign rider');
    }
  };

  return (
    <div className="h-screen flex">
      {/* Left Panel - Deliveries List */}
      <div className="w-1/4 bg-white p-4 overflow-y-auto border-r">
        <h2 className="text-xl font-bold mb-4">Active Deliveries</h2>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery._id}
                delivery={delivery}
                onSelect={() => setSelectedDelivery(delivery)}
                isSelected={selectedDelivery?._id === delivery._id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Delivery Details */}
      <div className="flex-1 bg-white p-4 border-l">
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {selectedDelivery ? (
          <DeliveryDetails
            delivery={selectedDelivery}
            riders={riders}
            onAssignRider={handleAssignRider}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a delivery to view details
          </div>
        )}
      </div>
    </div>
  );
}