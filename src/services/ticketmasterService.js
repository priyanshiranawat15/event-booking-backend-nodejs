const axios = require("axios");
const geohash = require("ngeohash");
const config = require("../config/config");

class TicketmasterService {
  constructor() {
    this.baseUrl = config.ticketmaster.baseUrl;
    this.apiKey = config.ticketmaster.apiKey;
    this.rateLimitDelay = 1000 / config.ticketmaster.rateLimitPerSecond; // Convert to milliseconds
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting to respect Ticketmaster API limits
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Make HTTP request to Ticketmaster API with error handling
   */
  async makeRequest(endpoint, params = {}) {
    try {
      await this.enforceRateLimit();

      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params: {
          apikey: this.apiKey,
          ...params,
        },
        timeout: 10000, // 10 second timeout
      });

      return response.data;
    } catch (error) {
      console.error(`Ticketmaster API Error (${endpoint}):`, error.message);

      if (error.response) {
        const { status, data } = error.response;
        throw new Error(
          `Ticketmaster API Error ${status}: ${data.message || error.message}`,
        );
      } else if (error.request) {
        throw new Error("Network error: Unable to reach Ticketmaster API");
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * Convert location coordinates to geohash for Ticketmaster API
   */
  convertToGeoPoint(lat, lng) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    // Create geohash with precision 7 (approximately 150m x 150m)
    return geohash.encode(parseFloat(lat), parseFloat(lng), 7);
  }

  /**
   * Map category names to Ticketmaster segment IDs
   */
  getCategorySegmentId(category) {
    const categoryMapping = {
      music: "KZFzniwnSyZfZ7v7nJ",
      sports: "KZFzniwnSyZfZ7v7nE",
      arts: "KZFzniwnSyZfZ7v7na",
      film: "KZFzniwnSyZfZ7v7nn",
      miscellaneous: "KZFzniwnSyZfZ7v7n1",
    };

    return categoryMapping[category?.toLowerCase()] || null;
  }

  /**
   * Search for events using Ticketmaster Discovery API
   */
  async searchEvents(searchParams) {
    try {
      const {
        keyword = "",
        category = "",
        distance = "10",
        latitude,
        longitude,
        page = 0,
        size = 20,
      } = searchParams;

      const params = {
        keyword: keyword.trim(),
        size: Math.min(size, 20), // Max 20 results as per requirements
        page: page,
        sort: "date,asc", // Sort by ascending local date/time as required
      };

      // Add category filter if provided
      if (category) {
        const segmentId = this.getCategorySegmentId(category);
        if (segmentId) {
          params.segmentId = segmentId;
        }
      }

      // Add location filter if coordinates provided
      if (latitude && longitude) {
        const geoPoint = this.convertToGeoPoint(latitude, longitude);
        if (geoPoint) {
          params.geoPoint = geoPoint;
          params.radius = distance;
          params.unit = "miles";
        }
      }

      const data = await this.makeRequest("/events.json", params);

      if (!data._embedded || !data._embedded.events) {
        return {
          events: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: page,
        };
      }

      const events = data._embedded.events.map((event) =>
        this.formatEventSummary(event),
      );

      return {
        events,
        totalElements: data.page?.totalElements || 0,
        totalPages: data.page?.totalPages || 0,
        currentPage: data.page?.number || 0,
        size: data.page?.size || 0,
      };
    } catch (error) {
      console.error("Event search error:", error.message);
      throw new Error(`Failed to search events: ${error.message}`);
    }
  }

  /**
   * Get detailed information for a specific event
   */
  async getEventDetails(eventId) {
    try {
      if (!eventId) {
        throw new Error("Event ID is required");
      }

      const data = await this.makeRequest(`/events/${eventId}.json`);
      return this.formatEventDetails(data);
    } catch (error) {
      console.error("Event details error:", error.message);
      throw new Error(`Failed to get event details: ${error.message}`);
    }
  }

  /**
   * Get detailed venue information including images
   */
  async getVenueDetails(venueId) {
    try {
      if (!venueId) {
        throw new Error("Venue ID is required");
      }

      const data = await this.makeRequest(`/venues/${venueId}.json`);
      return this.formatVenueDetails(data);
    } catch (error) {
      console.error("Venue details error:", error.message);
      // Don't throw error for venue details to avoid breaking event details
      return null;
    }
  }

  /**
   * Get autocomplete suggestions for event search
   */
  async getAutocompleteSuggestions(keyword) {
    try {
      if (!keyword || keyword.trim().length === 0) {
        return { suggestions: [] };
      }

      const params = {
        keyword: keyword.trim(),
      };

      const data = await this.makeRequest("/suggest.json", params);

      if (!data._embedded || !data._embedded.attractions) {
        return { suggestions: [] };
      }

      const suggestions = data._embedded.attractions.map((attraction) => ({
        name: attraction.name,
        type: attraction.type || "attraction",
        id: attraction.id,
      }));

      return { suggestions };
    } catch (error) {
      console.error("Autocomplete error:", error.message);
      // Don't throw error for autocomplete to avoid breaking user experience
      return { suggestions: [] };
    }
  }

  /**
   * Format event summary for search results
   */
  formatEventSummary(event) {
    const venue = event._embedded?.venues?.[0] || {};
    const classification = event.classifications?.[0] || {};
    const image = this.getEventImage(event.images);

    return {
      id: event.id,
      name: event.name,
      date: this.formatEventDate(event.dates),
      time: this.formatEventTime(event.dates),
      venue: {
        name: venue.name || "Venue TBD",
        city: venue.city?.name || "",
        state: venue.state?.name || venue.state?.stateCode || "",
      },
      genre:
        classification.genre?.name || classification.segment?.name || "General",
      subGenre: classification.subGenre?.name || "",
      image: image,
      images: event.images || [],
      priceRange: this.formatPriceRange(event.priceRanges),
      ticketStatus: event.dates?.status?.code || "unknown",
      url: event.url,
    };
  }

  /**
   * Format detailed event information
   */
  formatEventDetails(event) {
    const venue = event._embedded?.venues?.[0] || {};
    const attractions = event._embedded?.attractions || [];
    const classification = event.classifications?.[0] || {};

    return {
      id: event.id,
      name: event.name,
      description: event.info || "",
      dates: {
        start: this.formatEventDateTime(event.dates),
        timezone: event.dates?.timezone || "",
        status: {
          code: event.dates?.status?.code || "unknown",
          message: event.dates?.status?.message || "",
        },
      },
      artists: attractions.map((attraction) => ({
        name: attraction.name,
        id: attraction.id,
        type: attraction.type || "attraction",
        url: attraction.url,
        image: this.getEventImage(attraction.images),
      })),
      venue: {
        id: venue.id || null,
        name: venue.name || "Venue TBD",
        address: this.formatVenueAddress(venue),
        city: venue.city?.name || "",
        state: venue.state?.name || venue.state?.stateCode || "",
        country: venue.country?.name || venue.country?.countryCode || "",
        postalCode: venue.postalCode || "",
        location: venue.location
          ? {
              latitude: parseFloat(venue.location.latitude),
              longitude: parseFloat(venue.location.longitude),
            }
          : null,
        boxOfficeInfo: venue.boxOfficeInfo || null,
        generalInfo: venue.generalInfo || null,
        parkingDetail: venue.parkingDetail || null,
        image: this.getEventImage(venue.images) || null,
      },
      priceRanges: event.priceRanges || [],
      ticketLimit: event.ticketLimit || null,
      ageRestrictions: event.ageRestrictions || null,
      images: event.images || [],
      classifications: event.classifications || [],
      promoter: event.promoter || null,
      promoters: event.promoters || [],
      pleaseNote: event.pleaseNote || "",
      accessibility: event.accessibility || null,
      ticketingInfo: event.ticketing || null,
      seatmap: event.seatmap || null,
      social: {
        facebook: event.social?.facebook?.url || null,
        twitter: event.social?.twitter?.url || null,
        instagram: event.social?.instagram?.url || null,
      },
      externalLinks: event.externalLinks || null,
      url: event.url,
    };
  }

  /**
   * Get the best quality image from event images
   */
  getEventImage(images) {
    if (!images || images.length === 0) {
      return null;
    }

    // Sort by width to get highest quality image
    const sortedImages = images.sort((a, b) => (b.width || 0) - (a.width || 0));
    return sortedImages[0].url || null;
  }

  /**
   * Format event date
   */
  formatEventDate(dates) {
    if (!dates?.start?.localDate) {
      return null;
    }
    return dates.start.localDate;
  }

  /**
   * Format event time
   */
  formatEventTime(dates) {
    if (!dates?.start?.localTime) {
      return null;
    }
    return dates.start.localTime;
  }

  /**
   * Format complete event date time
   */
  formatEventDateTime(dates) {
    if (!dates?.start) {
      return null;
    }

    return {
      localDate: dates.start.localDate || null,
      localTime: dates.start.localTime || null,
      dateTime: dates.start.dateTime || null,
    };
  }

  /**
   * Format venue address
   */
  formatVenueAddress(venue) {
    if (!venue.address) {
      return null;
    }

    const addressLine1 = venue.address.line1 || "";
    const addressLine2 = venue.address.line2 || "";
    return [addressLine1, addressLine2].filter(Boolean).join(", ");
  }

  /**
   * Format price range
   */
  formatPriceRange(priceRanges) {
    if (!priceRanges || priceRanges.length === 0) {
      return null;
    }

    const price = priceRanges[0];
    return {
      min: price.min || null,
      max: price.max || null,
      currency: price.currency || "USD",
    };
  }

  /**
   * Format venue details from Ticketmaster venue API
   */
  formatVenueDetails(venue) {
    return {
      id: venue.id,
      name: venue.name || "Venue TBD",
      address: this.formatVenueAddress(venue),
      city: venue.city?.name || "",
      state: venue.state?.name || venue.state?.stateCode || "",
      country: venue.country?.name || venue.country?.countryCode || "",
      postalCode: venue.postalCode || "",
      location: venue.location
        ? {
            latitude: parseFloat(venue.location.latitude),
            longitude: parseFloat(venue.location.longitude),
          }
        : null,
      boxOfficeInfo: venue.boxOfficeInfo || null,
      generalInfo: venue.generalInfo || null,
      parkingDetail: venue.parkingDetail || null,
      accessibleSeatingDetail: venue.accessibleSeatingDetail || null,
      ada: venue.ada || null,
      childRule: venue.childRule || null,
      images: venue.images || [],
      image: this.getEventImage(venue.images) || null,
      timezone: venue.timezone || null,
      url: venue.url || null,
      social: {
        facebook: venue.social?.facebook?.url || null,
        twitter: venue.social?.twitter?.url || null,
        instagram: venue.social?.instagram?.url || null,
      },
      markets: venue.markets || [],
      dmas: venue.dmas || [],
    };
  }

  /**
   * Health check for Ticketmaster API
   */
  async healthCheck() {
    try {
      // Simple search to test API connectivity
      await this.makeRequest("/events.json", { size: 1 });
      return {
        status: "healthy",
        message: "Ticketmaster API is accessible",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `Ticketmaster API error: ${error.message}`,
      };
    }
  }
}

module.exports = new TicketmasterService();
