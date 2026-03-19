const axios = require('axios');
const config = require('../config/config');

class GeocodingService {
  constructor() {
    this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    this.apiKey = config.googleMaps?.apiKey || process.env.GOOGLE_MAPS_API_KEY;
  }

  /**
   * Geocode an address to get latitude and longitude coordinates
   * @param {string} address - The address to geocode
   * @returns {Promise<Object>} - Object containing lat, lng, and formatted address
   */
  async geocodeAddress(address) {
    try {
      if (!address || address.trim().length === 0) {
        throw new Error('Address is required for geocoding');
      }

      if (!this.apiKey) {
        throw new Error('Google Maps API key is not configured');
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          address: address.trim(),
          key: this.apiKey
        },
        timeout: 10000 // 10 second timeout
      });

      const data = response.data;

      if (data.status !== 'OK') {
        switch (data.status) {
          case 'ZERO_RESULTS':
            throw new Error('No results found for the provided address');
          case 'OVER_QUERY_LIMIT':
            throw new Error('Google Maps API quota exceeded');
          case 'REQUEST_DENIED':
            throw new Error('Google Maps API request denied. Check API key and permissions');
          case 'INVALID_REQUEST':
            throw new Error('Invalid geocoding request. Check address format');
          default:
            throw new Error(`Geocoding failed with status: ${data.status}`);
        }
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No geocoding results found');
      }

      const result = data.results[0];
      const location = result.geometry.location;

      return {
        latitude: location.lat,
        longitude: location.lng,
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components,
        placeId: result.place_id,
        types: result.types,
        viewport: result.geometry.viewport,
        locationType: result.geometry.location_type
      };

    } catch (error) {
      console.error('Geocoding service error:', error.message);

      if (error.response) {
        const { status, data } = error.response;
        throw new Error(`Google Maps API Error ${status}: ${data.error_message || error.message}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Google Maps API');
      } else {
        throw new Error(`Geocoding error: ${error.message}`);
      }
    }
  }

  /**
   * Reverse geocode coordinates to get address information
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {Promise<Object>} - Object containing address information
   */
  async reverseGeocode(latitude, longitude) {
    try {
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Valid latitude and longitude are required for reverse geocoding');
      }

      if (!this.apiKey) {
        throw new Error('Google Maps API key is not configured');
      }

      const response = await axios.get(this.baseUrl, {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.apiKey
        },
        timeout: 10000
      });

      const data = response.data;

      if (data.status !== 'OK') {
        throw new Error(`Reverse geocoding failed with status: ${data.status}`);
      }

      if (!data.results || data.results.length === 0) {
        throw new Error('No reverse geocoding results found');
      }

      const result = data.results[0];

      return {
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components,
        placeId: result.place_id,
        types: result.types
      };

    } catch (error) {
      console.error('Reverse geocoding service error:', error.message);
      throw new Error(`Reverse geocoding error: ${error.message}`);
    }
  }

  /**
   * Get multiple location suggestions for partial address input
   * @param {string} input - Partial address input
   * @param {Object} options - Additional options like bias location
   * @returns {Promise<Array>} - Array of location suggestions
   */
  async getLocationSuggestions(input, options = {}) {
    try {
      if (!input || input.trim().length === 0) {
        return [];
      }

      if (input.trim().length < 3) {
        return [];
      }

      const params = {
        address: input.trim(),
        key: this.apiKey
      };

      // Add location bias if provided
      if (options.latitude && options.longitude) {
        params.location = `${options.latitude},${options.longitude}`;
        params.radius = options.radius || 50000; // 50km default radius
      }

      // Add country restriction if provided
      if (options.country) {
        params.components = `country:${options.country}`;
      }

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000
      });

      const data = response.data;

      if (data.status !== 'OK') {
        return [];
      }

      return data.results.map(result => ({
        formattedAddress: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        placeId: result.place_id,
        types: result.types,
        addressComponents: result.address_components
      }));

    } catch (error) {
      console.error('Location suggestions error:', error.message);
      return [];
    }
  }

  /**
   * Validate coordinates
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   * @returns {boolean} - True if coordinates are valid
   */
  validateCoordinates(latitude, longitude) {
    return (
      latitude !== null &&
      longitude !== null &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  }

  /**
   * Extract city and state from address components
   * @param {Array} addressComponents - Address components from Google Maps API
   * @returns {Object} - Object containing city, state, and country
   */
  extractLocationInfo(addressComponents) {
    const locationInfo = {
      city: null,
      state: null,
      stateCode: null,
      country: null,
      countryCode: null,
      postalCode: null
    };

    if (!addressComponents || !Array.isArray(addressComponents)) {
      return locationInfo;
    }

    addressComponents.forEach(component => {
      const types = component.types;

      if (types.includes('locality')) {
        locationInfo.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        locationInfo.state = component.long_name;
        locationInfo.stateCode = component.short_name;
      } else if (types.includes('country')) {
        locationInfo.country = component.long_name;
        locationInfo.countryCode = component.short_name;
      } else if (types.includes('postal_code')) {
        locationInfo.postalCode = component.long_name;
      }
    });

    return locationInfo;
  }

  /**
   * Health check for Google Maps Geocoding API
   * @returns {Promise<Object>} - Health status
   */
  async healthCheck() {
    try {
      if (!this.apiKey) {
        return {
          status: 'unhealthy',
          message: 'Google Maps API key is not configured'
        };
      }

      // Test with a simple geocoding request
      await this.geocodeAddress('New York, NY');

      return {
        status: 'healthy',
        message: 'Google Maps Geocoding API is accessible'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Google Maps API error: ${error.message}`
      };
    }
  }
}

module.exports = new GeocodingService();
