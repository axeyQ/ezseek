// services/olaMapService.js
import axios from 'axios';

const OLA_MAPS_API_KEY = process.env.OLA_MAPS_API_KEY;
const OLA_MAPS_BASE_URL = 'https://api.olamaps.io';

export async function calculateOptimalRoute(pickupCoords, dropCoords) {
  try {
    const response = await axios.post(`${OLA_MAPS_BASE_URL}/routing/v1/routeOptimizer`, {
      apiKey: OLA_MAPS_API_KEY,
      coordinates: [pickupCoords, dropCoords],
      options: {
        trafficEnabled: true,
        alternativeRoutes: true
      }
    });

    return response.data;
  } catch (error) {
    console.error('Ola Maps API Error:', error);
    throw new Error('Failed to calculate route');
  }
}

export async function getGeocodeLocation(address) {
  try {
    const response = await axios.get(`${OLA_MAPS_BASE_URL}/places/v1/geocode`, {
      params: {
        address,
        apiKey: OLA_MAPS_API_KEY
      }
    });

    return response.data;
  } catch (error) {
    console.error('Geocoding Error:', error);
    throw new Error('Failed to geocode address');
  }
}