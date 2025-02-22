'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import OlaMaps with no SSR
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

export default function Maps() {
  return (
    <div id="map" style={{ width: '100%', height: '500px' }}>
      <Map />
    </div>
  );
}