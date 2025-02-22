// frontend/src/services/olaMaps/index.js
class OlaMapsService {
    constructor() {
      this.apiKey = process.env.OLA_MAPS_API_KEY;
      this.accessToken = null;
      this.baseUrl = OLA_MAPS_CONFIG.BASE_URL;
      this.sdk = null;
    }
  
    async initialize() {
      try {
        // Load OLA Maps SDK
        const { OlaMaps } = await import('olamaps-web-sdk');
        this.sdk = new OlaMaps({
          apiKey: this.apiKey
        });
  
        // Initialize services
        this.routing = new RoutingService(this);
        this.places = new PlacesService(this);
        this.geocoding = new GeocodingService(this);
  
        return this.sdk;
      } catch (error) {
        console.error('Failed to initialize OLA Maps:', error);
        throw error;
      }
    }
  
    // Get headers for API requests
    getRequestHeaders() {
      if (!this.accessToken) {
        throw new Error('Access token not set. Please authenticate first.');
      }
  
      return {
        ...OLA_MAPS_CONFIG.REQUEST_HEADERS,
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Request-Id': crypto.randomUUID(),
        'X-Correlation-Id': crypto.randomUUID()
      };
    }
  
    // Set access token after OAuth authentication
    setAccessToken(token) {
      this.accessToken = token;
    }
  }