// frontend/src/components/delivery/TrackingView.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { OlaMaps } from 'olamaps-web-sdk';

export default function TrackingView({ delivery }) {
  const mapRef = useRef(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const initializeTracking = async () => {
      // Initialize map
      const mapInstance = new OlaMaps({
        apiKey: process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY,
      });

      await mapInstance.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapRef.current,
        center: delivery.pickupLocation.coordinates,
        zoom: 13,
      });

      // Add markers for pickup and drop locations
      new OlaMaps.Marker({ color: '#4CAF50' })
        .setLngLat(delivery.pickupLocation.coordinates)
        .addTo(mapInstance);

      new OlaMaps.Marker({ color: '#F44336' })
        .setLngLat(delivery.dropLocation.coordinates)
        .addTo(mapInstance);

      // Initialize WebSocket connection
      wsRef.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'RIDER_LOCATION') {
          setRiderLocation(data.coordinates);
          updateRiderMarker(mapInstance, data.coordinates);
        }
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    };

    if (delivery) {
      initializeTracking();
    }
  }, [delivery]);

  const updateRiderMarker = (map, coordinates) => {
    // Update rider marker position
    // Implementation depends on how you're handling the rider marker
  };

  return (
    <div ref={mapRef} className="w-full h-full" />
  );
}
