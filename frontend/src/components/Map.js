'use client';

import { useEffect, useRef } from 'react';

export default function Map() {
  const mapRef = useRef(null);

  useEffect(() => {
    // Initialize map only after component mounts
    const initializeMap = async () => {
      try {
        const { OlaMaps } = await import('olamaps-web-sdk');
        const olaMaps = new OlaMaps({
          apiKey: 'hLAOPq84UM9OBhNlfAgsv18GrPyjB4ECfPtbgx6j',
        });

        const myMap = olaMaps.init({
          style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
          container: mapRef.current,
          center: [77.61648476788898, 12.931423492103944],
          zoom: 15,
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}