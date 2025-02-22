// frontend/src/utils/mapHelpers.js
export function calculateBounds(coordinates) {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }
  
    const bounds = {
      north: -90,
      south: 90,
      east: -180,
      west: 180
    };
  
    coordinates.forEach(([lng, lat]) => {
      bounds.north = Math.max(bounds.north, lat);
      bounds.south = Math.min(bounds.south, lat);
      bounds.east = Math.max(bounds.east, lng);
      bounds.west = Math.min(bounds.west, lng);
    });
  
    return bounds;
  }
  
  export function formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }
  
  export function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }