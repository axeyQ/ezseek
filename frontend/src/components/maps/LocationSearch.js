'use client';

import { useRef, useEffect, useState } from 'react';

export default function LocationSearch({ 
  onSelect, 
  mapInstance,
  placeholder = "Search for a location..." 
}) {
  const searchBoxRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    if (!window.KrutrimMaps || !mapInstance) return;

    try {
      // Initialize search box
      const searchBox = new window.KrutrimMaps.SearchBox();
      
      // Add search box to container
      const searchElement = searchBox.onAdd(mapInstance);
      searchContainerRef.current.appendChild(searchElement);

      // Store reference
      searchBoxRef.current = searchBox;

      // Set up event listeners
      searchBox.on('select', handleSearchResult);
      searchBox.on('error', handleSearchError);

      // Update placeholder
      const inputElement = searchElement.querySelector('input');
      if (inputElement) {
        inputElement.placeholder = placeholder;
      }

      return () => {
        if (searchBoxRef.current) {
          searchBoxRef.current.onRemove();
        }
      };
    } catch (error) {
      console.error('Error initializing search:', error);
      setSearchError(error.message);
    }
  }, [mapInstance, placeholder]);

  const handleSearchResult = (result) => {
    if (!result) return;

    try {
      // Format the result
      const formattedResult = {
        coordinates: {
          lat: result.coordinates[1],
          lng: result.coordinates[0]
        },
        address: {
          full: result.address,
          name: result.name,
          district: result.district,
          city: result.city,
          state: result.state,
          pincode: result.pincode
        },
        placeId: result.id
      };

      // Update map view
      mapInstance.flyTo({
        center: result.coordinates,
        zoom: 16,
        essential: true
      });

      // Callback
      if (onSelect) {
        onSelect(formattedResult);
      }

    } catch (error) {
      console.error('Error processing search result:', error);
      setSearchError('Error processing location data');
    }
  };

  const handleSearchError = (error) => {
    console.error('Search error:', error);
    setSearchError('Location search failed');
  };

  return (
    <div className="relative w-full">
      {searchError && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-2">
          <span className="block sm:inline">{searchError}</span>
          <button 
            onClick={() => setSearchError(null)}
            className="absolute top-0 bottom-0 right-0 px-4"
          >
            ×
          </button>
        </div>
      )}

      <div 
        ref={searchContainerRef}
        className="w-full"
      />
    </div>
  );
}