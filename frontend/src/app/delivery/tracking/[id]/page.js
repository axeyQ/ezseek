// src/app/delivery/tracking/[id]/page.js
'use client';

import { useState, useEffect, useRef } from 'react';

export default function DeliveryTracking({ params }) {
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);
  const mapContainerRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fetch delivery data
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fetch(`/api/delivery/${params.id}`);
        const data = await response.json();
        console.log('Delivery data loaded:', data);
        setDelivery(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch delivery data');
      }
    };
    fetchDelivery();
  }, [params.id]);

  // Initialize map
  useEffect(() => {
    if (!delivery || !window.olaMaps) return;

    let map = null;
    try {
      console.log('Starting map initialization...');
      
      // Ensure container is ready
      const container = document.getElementById('map-container');
      if (!container) {
        console.error('Map container not found');
        return;
      }

      // Set explicit dimensions
      container.style.width = '100%';
      container.style.height = '600px';

      // Initialize map
      map = new window.olaMaps.Map({
        container: 'map-container',
        style: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json',
        center: [77.6264847688898, 12.944698932103943], // Bengaluru coordinates
        zoom: 12,
        apiKey: process.env.OLA_MAPS_API_KEY
      });

      map.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);

        // Add markers after map is loaded
        try {
          // Add pickup marker
          new window.olaMaps.Marker()
            .setLngLat(delivery.pickupLocation.coordinates)
            .addTo(map);

          // Add drop marker
          new window.olaMaps.Marker()
            .setLngLat(delivery.dropLocation.coordinates)
            .addTo(map);
          
          // Fit bounds
          const bounds = new window.olaMaps.LngLatBounds();
          bounds.extend(delivery.pickupLocation.coordinates);
          bounds.extend(delivery.dropLocation.coordinates);
          map.fitBounds(bounds, { padding: 50 });
        } catch (err) {
          console.error('Error adding markers:', err);
        }
      });

      map.on('error', (err) => {
        console.error('Map error:', err);
        setError('Map failed to load properly');
      });

    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [delivery]);

  return (
    <div className="h-screen flex">
      {/* Map Container */}
      <div className="w-2/3 relative bg-gray-100">
        {error && (
          <div className="absolute top-4 right-4 z-10 bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        <div 
          id="map-container" 
          ref={mapContainerRef}
          className="w-full h-full" 
          style={{ 
            minHeight: '600px',
            border: '1px solid #ccc'
          }}
        />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="text-gray-600">Loading map...</div>
          </div>
        )}
      </div>

      {/* Delivery Info */}
      <div className="w-1/3 bg-white p-6 overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Tracking #{delivery?.trackingId}
            </h1>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full inline-block">
              {delivery?.status}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Pickup Location</h2>
            <p className="text-gray-600">{delivery?.pickupLocation?.address}</p>
            <p className="text-xs text-gray-500">
              {delivery?.pickupLocation?.coordinates?.join(', ')}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Drop Location</h2>
            <p className="text-gray-600">{delivery?.dropLocation?.address}</p>
            <p className="text-xs text-gray-500">
              {delivery?.dropLocation?.coordinates?.join(', ')}
            </p>
          </div>

          {delivery?.rider && (
            <div>
              <h2 className="text-lg font-semibold">Rider Details</h2>
              <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <p className="font-medium">{delivery.rider.name}</p>
                <p className="text-gray-600">{delivery.rider.phoneNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}