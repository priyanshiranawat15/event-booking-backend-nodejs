const ticketmasterService = require("../services/ticketmasterService");
const spotifyService = require("../services/spotifyService");
const geocodingService = require("../services/geocodingService");

class EventsController {
  /**
   * Search for events using Ticketmaster API
   * GET /api/events/search
   */
  async searchEvents(req, res) {
    try {
      const {
        keyword = "",
        category = "",
        distance = "10",
        location,
        page = "0",
        size = "20",
      } = req.query;

      // Validate required parameters
      if (!keyword || keyword.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Keyword parameter is required for event search",
        });
      }

      // Parse numeric parameters
      let searchParams = {
        keyword: keyword.trim(),
        category: category.trim(),
        distance: distance,
        location: location ? location.trim() : null,
        latitude: null,
        longitude: null,
        page: parseInt(page) || 0,
        size: Math.min(parseInt(size) || 20, 20), // Max 20 results
      };

      // Process location parameter if provided
      if (searchParams.location) {
        try {
          // Check if location is in coordinate format "lat,lng"
          const coordMatch = searchParams.location.match(
            /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/,
          );

          if (coordMatch) {
            // Parse coordinates directly
            const lat = parseFloat(coordMatch[1]);
            const lng = parseFloat(coordMatch[2]);

            // Validate coordinates
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
              return res.status(400).json({
                success: false,
                message:
                  "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180",
              });
            }

            searchParams.latitude = lat;
            searchParams.longitude = lng;
            searchParams.locationSource = "coordinates";

            console.log(`Using coordinates: ${lat}, ${lng}`);
          } else {
            // Treat as address string and geocode
            console.log(`Geocoding address: ${searchParams.location}`);
            const geocodeResult = await geocodingService.geocodeAddress(
              searchParams.location,
            );

            searchParams.latitude = geocodeResult.latitude;
            searchParams.longitude = geocodeResult.longitude;
            searchParams.geocodedAddress = geocodeResult.formattedAddress;
            searchParams.locationSource = "geocoded";

            console.log(
              `Geocoded "${searchParams.location}" to: ${geocodeResult.latitude}, ${geocodeResult.longitude}`,
            );
          }
        } catch (locationError) {
          console.warn(
            `Location processing failed for "${searchParams.location}":`,
            locationError.message,
          );
          // Continue search without location filter rather than failing
          searchParams.locationError = locationError.message;
        }
      }

      const result = await ticketmasterService.searchEvents(searchParams);

      res.json({
        success: true,
        message: "Events retrieved successfully",
        data: result,
        searchParams: {
          keyword: searchParams.keyword,
          category: searchParams.category,
          distance: searchParams.distance,
          location: searchParams.location,
          locationSource: searchParams.locationSource,
          geocodedAddress: searchParams.geocodedAddress,
          hasLocation: !!(searchParams.latitude && searchParams.longitude),
          locationError: searchParams.locationError,
        },
      });
    } catch (error) {
      console.error("Events search controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to search events",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get detailed information for a specific event
   * GET /api/events/:id
   */
  async getEventDetails(req, res) {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const eventDetails = await ticketmasterService.getEventDetails(id);

      // If event has venue ID, get detailed venue information including images
      let enhancedVenueDetails = eventDetails.venue;
      if (eventDetails.venue && eventDetails.venue.id) {
        try {
          const venueDetails = await ticketmasterService.getVenueDetails(
            eventDetails.venue.id,
          );
          if (venueDetails) {
            // Merge venue details with enhanced information, prioritizing venue API data for images
            enhancedVenueDetails = {
              ...eventDetails.venue,
              ...venueDetails,
              // Ensure we keep the venue location from event if venue details doesn't have it
              location: venueDetails.location || eventDetails.venue.location,
            };
          }
        } catch (venueError) {
          console.warn("Venue details API error:", venueError.message);
          // Continue with basic venue data from event
        }
      }

      // If event has artists and is music-related, get Spotify info for the first artist
      let spotifyArtistInfo = null;
      if (eventDetails.artists && eventDetails.artists.length > 0) {
        const firstArtist = eventDetails.artists[0];
        const eventGenre = eventDetails.classifications?.[0]?.genre?.name || "";
        const eventSegment =
          eventDetails.classifications?.[0]?.segment?.name || "";

        try {
          spotifyArtistInfo = await spotifyService.getArtistForEvent(
            firstArtist.name,
            eventGenre,
            eventSegment,
          );
        } catch (spotifyError) {
          console.warn(
            "Spotify API error for artist lookup:",
            spotifyError.message,
          );
          // Continue without Spotify data
        }
      }

      // Update event details with enhanced venue information
      const enhancedEventDetails = {
        ...eventDetails,
        venue: enhancedVenueDetails,
      };

      res.json({
        success: true,
        message: "Event details retrieved successfully",
        data: {
          event: enhancedEventDetails,
          spotifyArtist: spotifyArtistInfo,
        },
      });
    } catch (error) {
      console.error("Event details controller error:", error.message);

      if (
        error.message.includes("404") ||
        error.message.includes("not found")
      ) {
        res.status(404).json({
          success: false,
          message: "Event not found",
          error: "The requested event could not be found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to get event details",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
        });
      }
    }
  }

  /**
   * Get autocomplete suggestions for event search
   * GET /api/events/suggest
   */
  async getAutocompleteSuggestions(req, res) {
    try {
      const { keyword } = req.query;

      if (!keyword || keyword.trim().length === 0) {
        return res.json({
          success: true,
          message: "No keyword provided",
          data: { suggestions: [] },
        });
      }

      if (keyword.trim().length < 2) {
        return res.json({
          success: true,
          message: "Keyword too short for suggestions",
          data: { suggestions: [] },
        });
      }

      const result =
        await ticketmasterService.getAutocompleteSuggestions(keyword);

      res.json({
        success: true,
        message: "Suggestions retrieved successfully",
        data: result,
      });
    } catch (error) {
      console.error("Autocomplete controller error:", error.message);

      // For autocomplete, we don't want to break user experience with errors
      res.json({
        success: false,
        message: "Failed to get suggestions",
        data: { suggestions: [] },
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Suggestion service unavailable",
      });
    }
  }

  /**
   * Health check for events service
   * GET /api/events/health
   */
  async healthCheck(req, res) {
    try {
      const ticketmasterHealth = await ticketmasterService.healthCheck();
      const spotifyHealth = await spotifyService.healthCheck();
      const geocodingHealth = await geocodingService.healthCheck();

      const overallStatus =
        ticketmasterHealth.status === "healthy" &&
        spotifyHealth.status === "healthy" &&
        geocodingHealth.status === "healthy"
          ? "healthy"
          : "degraded";

      res.json({
        success: true,
        status: overallStatus,
        services: {
          ticketmaster: ticketmasterHealth,
          spotify: spotifyHealth,
          geocoding: geocodingHealth,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Events health check error:", error.message);
      res.status(500).json({
        success: false,
        status: "unhealthy",
        message: "Health check failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get available event categories for dropdown
   * GET /api/events/categories
   */
  async getEventCategories(req, res) {
    try {
      const categories = [
        { id: "music", name: "Music", segmentId: "KZFzniwnSyZfZ7v7nJ" },
        { id: "sports", name: "Sports", segmentId: "KZFzniwnSyZfZ7v7nE" },
        { id: "arts", name: "Arts & Theatre", segmentId: "KZFzniwnSyZfZ7v7na" },
        { id: "film", name: "Film", segmentId: "KZFzniwnSyZfZ7v7nn" },
        {
          id: "miscellaneous",
          name: "Miscellaneous",
          segmentId: "KZFzniwnSyZfZ7v7n1",
        },
      ];

      res.json({
        success: true,
        message: "Event categories retrieved successfully",
        data: { categories },
      });
    } catch (error) {
      console.error("Get categories error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get event categories",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get location suggestions for address autocomplete
   * GET /api/events/locations/suggest
   */
  async getLocationSuggestions(req, res) {
    try {
      const { input, latitude, longitude, country } = req.query;

      if (!input || input.trim().length === 0) {
        return res.json({
          success: true,
          message: "No input provided",
          data: { suggestions: [] },
        });
      }

      if (input.trim().length < 3) {
        return res.json({
          success: true,
          message: "Input too short for location suggestions",
          data: { suggestions: [] },
        });
      }

      const options = {};
      if (latitude && longitude) {
        options.latitude = parseFloat(latitude);
        options.longitude = parseFloat(longitude);
      }
      if (country) {
        options.country = country;
      }

      const suggestions = await geocodingService.getLocationSuggestions(
        input,
        options,
      );

      res.json({
        success: true,
        message: "Location suggestions retrieved successfully",
        data: { suggestions },
      });
    } catch (error) {
      console.error("Location suggestions error:", error.message);

      // For location suggestions, we don't want to break user experience with errors
      res.json({
        success: false,
        message: "Failed to get location suggestions",
        data: { suggestions: [] },
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Location service unavailable",
      });
    }
  }

  /**
   * Geocode an address to coordinates
   * GET /api/events/geocode
   */
  async geocodeAddress(req, res) {
    try {
      const { address } = req.query;

      if (!address || address.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Address parameter is required for geocoding",
        });
      }

      const result = await geocodingService.geocodeAddress(address);

      res.json({
        success: true,
        message: "Address geocoded successfully",
        data: {
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
          formattedAddress: result.formattedAddress,
          locationInfo: geocodingService.extractLocationInfo(
            result.addressComponents,
          ),
          placeId: result.placeId,
        },
      });
    } catch (error) {
      console.error("Geocoding controller error:", error.message);

      if (error.message.includes("No results found")) {
        res.status(404).json({
          success: false,
          message: "Address not found",
          error: "The provided address could not be geocoded",
        });
      } else if (error.message.includes("API key")) {
        res.status(503).json({
          success: false,
          message: "Geocoding service unavailable",
          error: "Geocoding service configuration error",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to geocode address",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Geocoding service error",
        });
      }
    }
  }
}

module.exports = new EventsController();
