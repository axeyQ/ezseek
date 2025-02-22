// frontend/src/components/delivery/DeliveryMap.js
'use client';

import { useEffect, useRef } from 'react';
import { OlaMaps } from 'olamaps-web-sdk';

export default function DeliveryMap({ 
  deliveries, 
  selectedDelivery, 
  onMarkerClick 
}) {
  const mapRef = useRef(null);
  const markersRef = useRef({});

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

      // Store map instance
      mapRef.current = mapInstance;

      // Add markers for all deliveries
      deliveries.forEach(delivery => {
        addDeliveryMarker(delivery);
      });
    };

    if (!mapRef.current) {
      initializeMap();
    }
  }, []);

  useEffect(() => {
    if (selectedDelivery && mapRef.current) {
      // Center map on selected delivery
      mapRef.current.flyTo({
        center: selectedDelivery.pickupLocation.coordinates,
        zoom: 14
      });

      // Highlight selected marker
      Object.values(markersRef.current).forEach(marker => {
        marker.getElement().classList.remove('selected');
      });
      
      const selectedMarker = markersRef.current[selectedDelivery._id];
      if (selectedMarker) {
        selectedMarker.getElement().classList.add('selected');
      }
    }
  }, [selectedDelivery]);

  const addDeliveryMarker = (delivery) => {
    if (!mapRef.current) return;

    const marker = new OlaMaps.Marker({
      color: getMarkerColor(delivery.status),
      draggable: false
    })
      .setLngLat(delivery.pickupLocation.coordinates)
      .addTo(mapRef.current);

    marker.getElement().addEventListener('click', () => {
      onMarkerClick(delivery);
    });

    markersRef.current[delivery._id] = marker;
  };

  const getMarkerColor = (status) => {
    const colors = {
      PENDING: '#FFA500',
      ASSIGNED: '#0000FF',
      PICKED_UP: '#800080',
      IN_TRANSIT: '#4B0082',
      DELIVERED: '#008000',
      FAILED: '#FF0000'
    };
    return colors[status] || '#000000';
  };

  return <div ref={mapRef} className="w-full h-full" />;
}