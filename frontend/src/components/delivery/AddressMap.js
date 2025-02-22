// frontend/src/components/maps/AddressMap.js
'use client';

import { useEffect, useRef } from 'react';
import { OlaMaps } from 'olamaps-web-sdk';

export default function AddressMap({ 
  address, 
  onLocationSelect 
}) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const initializeMap = async () => {
      const mapInstance = new OlaMaps({
        apiKey: process.env.NEXT_PUBLIC_OLA_MAPS_API_KEY,
      });

      await mapInstance.init({
        style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
        container: mapRef.current,
        center: [77.6164847688898, 12.934698932103944],
        zoom: 12,
      });

      // Add marker
      markerRef.current = new OlaMaps.Marker({
        draggable: true
      })
        .setLngLat([77.6164847688898, 12.934698932103944])
        .addTo(mapInstance);

      // Handle marker drag end
      markerRef.current.on('dragend', () => {
        const lngLat = markerRef.current.getLngLat();
        onLocationSelect([lngLat.lng, lngLat.lat]);
      });

      // If address is provided, geocode it
      if (address) {
        const coordinates = await geocodeAddress(address);
        if (coordinates) {
          markerRef.current.setLngLat(coordinates);
          mapInstance.flyTo({
            center: coordinates,
            zoom: 15
          });
        }
      }
    };

    initializeMap();
  }, [address]);

  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json();
      return data.coordinates;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}