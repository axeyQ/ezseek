// frontend/src/services/deliveryRouting.js
export class DeliveryRoutingService {
    constructor() {
      this.olaMapsService = new OlaMapsService();
    }
  
    async initialize(accessToken) {
      await this.olaMapsService.initialize();
      this.olaMapsService.setAccessToken(accessToken);
    }
  
    async calculateDeliveryRoute(pickup, dropoff, options = {}) {
      try {
        // Format origin and destination according to OLA Maps requirements
        const route = await this.olaMapsService.routing.getDirections(
          {
            latitude: pickup.latitude,
            longitude: pickup.longitude
          },
          {
            latitude: dropoff.latitude,
            longitude: dropoff.longitude
          },
          {
            steps: true,
            alternatives: false,
            overview: 'full'
          }
        );
  
        return route;
      } catch (error) {
        console.error('Delivery route calculation error:', error);
        throw error;
      }
    }
  
    async optimizeDeliveryRoutes(riders, deliveries) {
      try {
        // Format fleet and delivery data
        const fleet = riders.map(rider => ({
          id: rider._id,
          startLocation: rider.currentLocation,
          constraints: {
            maxDeliveries: 10,
            maxDistance: 50000 // 50km
          }
        }));
  
        const deliveryPoints = deliveries.map(delivery => ({
          id: delivery._id,
          pickup: delivery.pickupLocation,
          dropoff: delivery.dropLocation,
          timeWindow: {
            start: delivery.expectedPickupTime,
            end: delivery.expectedDeliveryTime
          }
        }));
  
        const optimizedRoutes = await this.olaMapsService.routing.optimizeRoute(
          fleet,
          deliveryPoints,
          {
            optimizationCriteria: ['distance', 'time']
          }
        );
  
        return optimizedRoutes;
      } catch (error) {
        console.error('Route optimization error:', error);
        throw error;
      }
    }
  }
  
  // Example usage in your application
  export const initializeDeliveryRouting = async () => {
    try {
      const deliveryService = new DeliveryRoutingService();
      
      // Initialize with OAuth access token
      await deliveryService.initialize('63a9326b-7c4d-4983-b490-456773790ec4');
      
      return deliveryService;
    } catch (error) {
      console.error('Failed to initialize delivery routing:', error);
      throw error;
    }
  };