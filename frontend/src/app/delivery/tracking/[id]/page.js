// src/app/delivery/tracking/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OlaMaps } from 'olamaps-web-sdk';
import { Alert, AlertDescription } from '@/components/ui/Alert';

export default function DeliveryTracking({ params }) {
  const router = useRouter();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);
  const [map, setMap] = useState(null);
  const [riderMarker, setRiderMarker] = useState(null);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fetch(`/api/delivery/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch delivery');
        const data = await response.json();
        setDelivery(data);
        initializeMap(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchDelivery();
  }, [params.id]);

  const initializeMap = async (deliveryData) => {
    if (!deliveryData) return;

    const mapInstance = new OlaMaps({
      apiKey: process.env.OLA_MAPS_API_KEY,
    });

    await mapInstance.init({
      style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
      container: 'map',
      center: deliveryData.pickupLocation.coordinates,
      zoom: 13,
    });

    // Add pickup marker
    new OlaMaps.Marker({
      color: '#4CAF50' // Green
    })
      .setLngLat(deliveryData.pickupLocation.coordinates)
      .setPopup(new OlaMaps.Popup().setHTML('Pickup Location'))
      .addTo(mapInstance);

    // Add drop marker
    new OlaMaps.Marker({
      color: '#F44336' // Red
    })
      .setLngLat(deliveryData.dropLocation.coordinates)
      .setPopup(new OlaMaps.Popup().setHTML('Drop Location'))
      .addTo(mapInstance);

    // Add rider marker if assigned
    if (deliveryData.rider?.currentLocation) {
      const marker = new OlaMaps.Marker({
        color: '#2196F3' // Blue
      })
        .setLngLat(deliveryData.rider.currentLocation.coordinates)
        .setPopup(new OlaMaps.Popup().setHTML('Rider Location'))
        .addTo(mapInstance);
      
      setRiderMarker(marker);
    }

    setMap(mapInstance);

    // Draw route
    const coordinates = [
      deliveryData.pickupLocation.coordinates,
      ...(deliveryData.rider?.currentLocation ? [deliveryData.rider.currentLocation.coordinates] : []),
      deliveryData.dropLocation.coordinates
    ];

    // Get route from Ola Maps API and display it
    try {
      const route = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates })
      }).then(res => res.json());

      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route.geometry
        }
      });

      mapInstance.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2196F3',
          'line-width': 4
        }
      });
    } catch (err) {
      console.error('Failed to load route:', err);
    }
  };

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Map Container */}
      <div className="w-2/3 relative">
        <div id="map" className="w-full h-full" />
      </div>

      {/* Tracking Info Panel */}
      <div className="w-1/3 bg-white p-4 overflow-y-auto">
        {delivery ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">
                Tracking #{delivery.trackingId}
              </h1>
              <StatusBadge status={delivery.status} />
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Delivery Status</h2>
                <DeliveryProgress delivery={delivery} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">Pickup Location</h2>
                <p className="text-gray-600">{delivery.pickupLocation.address}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold">Drop Location</h2>
                <p className="text-gray-600">{delivery.dropLocation.address}</p>
              </div>

              {delivery.rider && (
                <div>
                  <h2 className="text-lg font-semibold">Rider Details</h2>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{delivery.rider.name}</p>
                    <p className="text-gray-600">{delivery.rider.phoneNumber}</p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-lg font-semibold">Estimated Time</h2>
                <p className="text-gray-600">
                  {formatTime(delivery.estimatedTime)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryProgress({ delivery }) {
  const steps = [
    { status: 'PENDING', label: 'Order Placed' },
    { status: 'ASSIGNED', label: 'Rider Assigned' },
    { status: 'PICKED_UP', label: 'Order Picked Up' },
    { status: 'IN_TRANSIT', label: 'In Transit' },
    { status: 'DELIVERED', label: 'Delivered' }
  ];

  const currentStep = steps.findIndex(step => step.status === delivery.status);

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div
          key={step.status}
          className={`flex items-center ${
            index <= currentStep ? 'text-blue-600' : 'text-gray-400'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 ${
              index <= currentStep
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            {index <= currentStep && '✓'}
          </div>
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  );
}