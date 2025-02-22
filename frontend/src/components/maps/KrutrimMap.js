'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_CENTER = [77.5946, 12.9716]; // Bangalore center
const DEFAULT_ZOOM = 12;

export default function KrutrimMap({ 
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  onMapClick,
  onMapLoad,
  showMarker = false,
  markerDraggable = false
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const initializeMap = async () => {
    try {
      // Check if KrutrimMaps is loaded
      if (!window.KrutrimMaps) {
        throw new Error('Krutrim Maps SDK not loaded');
      }

      // Initialize map
      const map = new window.KrutrimMaps.Map({
        container: mapContainerRef.current,
        center: center,
        zoom: zoom,
        style: 'default' // or any other available style
      });

      // Store map instance
      mapInstanceRef.current = map;

      // Add controls
      map.addControl(new window.KrutrimMaps.NavigationControl(), 'top-right');
      map.addControl(
        new window.KrutrimMaps.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }),
        'top-right'
      );

      // Add scale control
      map.addControl(new window.KrutrimMaps.ScaleControl(), 'bottom-left');

      // Setup event listeners
      map.on('load', handleMapLoad);
      map.on('click', handleMapClick);
      map.on('error', handleMapError);

      // Add marker if needed
      if (showMarker) {
        addMarker(center, markerDraggable);
      }

      setIsMapLoaded(true);
      if (onMapLoad) onMapLoad(map);

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError(error.message);
    }
  };

  const handleMapLoad = () => {
    console.log('Map loaded successfully');
  };

  const handleMapClick = (event) => {
    if (onMapClick) {
      onMapClick(event);
    }

    if (showMarker) {
      updateMarkerPosition(event.lngLat);
    }
  };

  const handleMapError = (error) => {
    console.error('Map error:', error);
    setMapError(error.message);
  };

  const addMarker = (position, draggable = false) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker if any
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create new marker
    const marker = new window.KrutrimMaps.Marker({
      draggable: draggable
    })
      .setLngLat(position)
      .addTo(mapInstanceRef.current);

    // Add drag events if marker is draggable
    if (draggable) {
      marker.on('dragend', () => {
        const newPos = marker.getLngLat();
        if (onMapClick) {
          onMapClick({ lngLat: newPos });
        }
      });
    }

    markerRef.current = marker;
  };

  const updateMarkerPosition = (position) => {
    if (markerRef.current) {
      markerRef.current.setLngLat(position);
    } else {
      addMarker(position, markerDraggable);
    }
  };

  // Expose methods to parent component
  const mapMethods = {
    setCenter: (center) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(center);
      }
    },
    setZoom: (zoom) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setZoom(zoom);
      }
    },
    flyTo: (options) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo(options);
      }
    }
  };

  return (
    <div className="relative w-full">
      {mapError && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {mapError}</span>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-[400px] rounded-lg shadow-sm overflow-hidden"
      />

      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="text-gray-600">Loading map...</div>
        </div>
      )}
    </div>
  );
}