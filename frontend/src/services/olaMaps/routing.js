// frontend/src/services/olaMaps/routing.js
class RoutingService {
    constructor(olaMapsService) {
      this.olaMapsService = olaMapsService;
    }
  
    async getDirections(origin, destination, options = {}) {
      try {
        const response = await fetch(`${this.olaMapsService.baseUrl}/directions`, {
          method: 'POST',
          headers: this.olaMapsService.getRequestHeaders(),
          body: JSON.stringify({
            origin,
            destination,
            waypoints: options.waypoints || [],
            alternatives: options.alternatives || false,
            steps: options.steps || true,
            overview: options.overview || 'full',
            language: options.language || OLA_MAPS_CONFIG.DEFAULT_LANGUAGE
          })
        });
  
        if (!response.ok) {
          throw new Error(`Directions API error: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Directions API error:', error);
        throw error;
      }
    }
  
    async optimizeRoute(fleet, deliveries, options = {}) {
      try {
        const response = await fetch(`${this.olaMapsService.baseUrl}/route-optimizer`, {
          method: 'POST',
          headers: this.olaMapsService.getRequestHeaders(),
          body: JSON.stringify({
            fleet,
            deliveries,
            ...options
          })
        });
  
        if (!response.ok) {
          throw new Error(`Route optimization error: ${response.statusText}`);
        }
  
        return await response.json();
      } catch (error) {
        console.error('Route optimization error:', error);
        throw error;
      }
    }
  }
  