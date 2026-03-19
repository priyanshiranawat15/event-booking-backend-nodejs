const express = require("express");
const router = express.Router();
const eventsController = require("../controllers/eventsController");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @swagger
 * /api/events/search:
 *   get:
 *     tags:
 *       - Events
 *     summary: Search for events using Ticketmaster API
 *     description: Search for events by keyword, category, location, and other filters. Returns paginated results sorted by date.
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: true
 *         description: Search keyword for events
 *         schema:
 *           type: string
 *           example: "Taylor Swift"
 *       - name: category
 *         in: query
 *         required: false
 *         description: Event category filter
 *         schema:
 *           type: string
 *           enum: [music, sports, arts, film, miscellaneous]
 *           example: "music"
 *       - name: distance
 *         in: query
 *         required: false
 *         description: Search radius in miles
 *         schema:
 *           type: string
 *           default: "10"
 *           example: "50"
 *       - name: location
 *         in: query
 *         required: false
 *         description: Location for search - can be coordinates "lat,lng" or address string
 *         schema:
 *           type: string
 *           examples:
 *             coordinates: "40.7128,-74.0060"
 *             address: "Los Angeles, CA"
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 0
 *       - name: size
 *         in: query
 *         required: false
 *         description: Number of results per page (maximum 20)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 20
 *           example: 10
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventSearchResponse'
 *             examples:
 *               success:
 *                 summary: Successful search
 *                 value:
 *                   success: true
 *                   message: "Events retrieved successfully"
 *                   data:
 *                     events:
 *                       - id: "G5vYZ9VJfenpl"
 *                         name: "Taylor Swift | The Eras Tour"
 *                         date: "2024-07-15"
 *                         time: "20:00"
 *                         venue:
 *                           name: "MetLife Stadium"
 *                           city: "East Rutherford"
 *                           state: "NJ"
 *                         genre: "Music"
 *                         subGenre: "Pop"
 *                         image: "https://s1.ticketm.net/dam/a/123/abc123.jpg"
 *                         priceRange:
 *                           min: 75
 *                           max: 450
 *                           currency: "USD"
 *                         ticketStatus: "onsale"
 *                         url: "https://www.ticketmaster.com/event/123"
 *                     totalElements: 150
 *                     totalPages: 8
 *                     currentPage: 0
 *                     size: 20
 *                   searchParams:
 *                     keyword: "Taylor Swift"
 *                     category: "music"
 *                     distance: "50"
 *                     hasLocation: true
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_keyword:
 *                 summary: Missing keyword parameter
 *                 value:
 *                   success: false
 *                   message: "Keyword parameter is required for event search"
 *               invalid_coordinates:
 *                 summary: Invalid coordinates
 *                 value:
 *                   success: false
 *                   message: "Both latitude and longitude are required for location-based search"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to search events"
 *               error: "Ticketmaster API error"
 */
router.get("/search", asyncHandler(eventsController.searchEvents));

/**
 * @swagger
 * /api/events/suggest:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get autocomplete suggestions for event search
 *     description: Provides autocomplete suggestions based on keyword input for enhanced search experience
 *     parameters:
 *       - name: keyword
 *         in: query
 *         required: true
 *         description: Search keyword for suggestions (minimum 2 characters)
 *         schema:
 *           type: string
 *           minLength: 2
 *           example: "concert"
 *     responses:
 *       200:
 *         description: Suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuggestionsResponse'
 *             examples:
 *               with_suggestions:
 *                 summary: Suggestions found
 *                 value:
 *                   success: true
 *                   message: "Suggestions retrieved successfully"
 *                   data:
 *                     suggestions:
 *                       - name: "Taylor Swift"
 *                         type: "attraction"
 *                         id: "K8vZ917G1V7"
 *                       - name: "Concert Hall"
 *                         type: "venue"
 *                         id: "KovZpZAJledA"
 *               no_suggestions:
 *                 summary: No suggestions found
 *                 value:
 *                   success: true
 *                   message: "No keyword provided"
 *                   data:
 *                     suggestions: []
 *       400:
 *         description: Bad request - invalid keyword
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/suggest",
  asyncHandler(eventsController.getAutocompleteSuggestions),
);

/**
 * @swagger
 * /api/events/categories:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get available event categories for dropdown
 *     description: Returns all available event categories with their corresponding Ticketmaster segment IDs
 *     responses:
 *       200:
 *         description: Event categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *             example:
 *               success: true
 *               message: "Event categories retrieved successfully"
 *               data:
 *                 categories:
 *                   - id: "music"
 *                     name: "Music"
 *                     segmentId: "KZFzniwnSyZfZ7v7nJ"
 *                   - id: "sports"
 *                     name: "Sports"
 *                     segmentId: "KZFzniwnSyZfZ7v7nE"
 *                   - id: "arts"
 *                     name: "Arts & Theatre"
 *                     segmentId: "KZFzniwnSyZfZ7v7na"
 *                   - id: "film"
 *                     name: "Film"
 *                     segmentId: "KZFzniwnSyZfZ7v7nn"
 *                   - id: "miscellaneous"
 *                     name: "Miscellaneous"
 *                     segmentId: "KZFzniwnSyZfZ7v7n1"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/categories", asyncHandler(eventsController.getEventCategories));

/**
 * @swagger
 * /api/events/health:
 *   get:
 *     tags:
 *       - Events
 *       - Health
 *     summary: Health check for events services
 *     description: Checks the health status of Ticketmaster and Spotify API services
 *     responses:
 *       200:
 *         description: Services health status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                   example: "healthy"
 *                 services:
 *                   type: object
 *                   properties:
 *                     ticketmaster:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         message:
 *                           type: string
 *                           example: "Ticketmaster API is accessible"
 *                     spotify:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         message:
 *                           type: string
 *                           example: "Spotify API is accessible"
 *                         tokenStatus:
 *                           type: string
 *                           example: "valid"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *             examples:
 *               healthy:
 *                 summary: All services healthy
 *                 value:
 *                   success: true
 *                   status: "healthy"
 *                   services:
 *                     ticketmaster:
 *                       status: "healthy"
 *                       message: "Ticketmaster API is accessible"
 *                     spotify:
 *                       status: "healthy"
 *                       message: "Spotify API is accessible"
 *                       tokenStatus: "valid"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *               degraded:
 *                 summary: Some services unhealthy
 *                 value:
 *                   success: true
 *                   status: "degraded"
 *                   services:
 *                     ticketmaster:
 *                       status: "healthy"
 *                       message: "Ticketmaster API is accessible"
 *                     spotify:
 *                       status: "unhealthy"
 *                       message: "Spotify API error: Authentication failed"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 message:
 *                   type: string
 *                   example: "Health check failed"
 *                 error:
 *                   type: string
 *                   example: "Service unavailable"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get("/health", asyncHandler(eventsController.healthCheck));

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get detailed information for a specific event
 *     description: Retrieves comprehensive event details including venue information, artists, pricing, and additional metadata. For music events, includes Spotify artist information.
 *     parameters:
 *       - $ref: '#/components/parameters/EventIdParam'
 *     responses:
 *       200:
 *         description: Event details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Event details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/EventDetails'
 *                     spotifyArtist:
 *                       oneOf:
 *                         - $ref: '#/components/schemas/SpotifyArtist'
 *                         - type: null
 *             examples:
 *               music_event:
 *                 summary: Music event with Spotify data
 *                 value:
 *                   success: true
 *                   message: "Event details retrieved successfully"
 *                   data:
 *                     event:
 *                       id: "G5vYZ9VJfenpl"
 *                       name: "Taylor Swift | The Eras Tour"
 *                       description: "Join Taylor Swift for an unforgettable evening..."
 *                       dates:
 *                         start:
 *                           localDate: "2024-07-15"
 *                           localTime: "20:00"
 *                           dateTime: "2024-07-16T00:00:00Z"
 *                         timezone: "America/New_York"
 *                         status:
 *                           code: "onsale"
 *                           message: "On Sale"
 *                       artists:
 *                         - name: "Taylor Swift"
 *                           id: "K8vZ917G1V7"
 *                           type: "artist"
 *                           url: "https://www.ticketmaster.com/artist/123"
 *                       venue:
 *                         name: "MetLife Stadium"
 *                         address: "1 MetLife Stadium Dr"
 *                         city: "East Rutherford"
 *                         state: "NJ"
 *                         country: "United States"
 *                         postalCode: "07073"
 *                         location:
 *                           latitude: 40.8135
 *                           longitude: -74.0745
 *                       priceRanges:
 *                         - min: 75
 *                           max: 450
 *                           currency: "USD"
 *                       social:
 *                         facebook: "https://www.facebook.com/TaylorSwift"
 *                         twitter: "https://twitter.com/taylorswift13"
 *                         instagram: "https://www.instagram.com/taylorswift"
 *                       url: "https://www.ticketmaster.com/event/123"
 *                     spotifyArtist:
 *                       id: "06HL4z0CvFAxyc27GXpf02"
 *                       name: "Taylor Swift"
 *                       popularity: 95
 *                       followers: 50000000
 *                       genres: ["pop", "country"]
 *                       images:
 *                         large: "https://i.scdn.co/image/ab6761610000e5eba574c2ff91a8eb4ff96da89e"
 *                         medium: "https://i.scdn.co/image/ab67616100005174a574c2ff91a8eb4ff96da89e"
 *                         small: "https://i.scdn.co/image/ab67616100005174a574c2ff91a8eb4ff96da89e"
 *                       externalUrls:
 *                         spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02"
 *               non_music_event:
 *                 summary: Non-music event without Spotify data
 *                 value:
 *                   success: true
 *                   message: "Event details retrieved successfully"
 *                   data:
 *                     event:
 *                       id: "G5vYZ9VJfABCd"
 *                       name: "New York Yankees vs Boston Red Sox"
 *                       description: "Classic rivalry matchup..."
 *                       dates:
 *                         start:
 *                           localDate: "2024-08-15"
 *                           localTime: "19:05"
 *                       venue:
 *                         name: "Yankee Stadium"
 *                         city: "Bronx"
 *                         state: "NY"
 *                     spotifyArtist: null
 *       400:
 *         description: Bad request - invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Event ID is required"
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Event not found"
 *               error: "The requested event could not be found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", asyncHandler(eventsController.getEventDetails));

/**
 * @swagger
 * /api/events/geocode:
 *   get:
 *     tags:
 *       - Events
 *     summary: Geocode an address to coordinates
 *     description: Convert an address string to latitude and longitude coordinates using Google Maps API
 *     parameters:
 *       - name: address
 *         in: query
 *         required: true
 *         description: Address to geocode
 *         schema:
 *           type: string
 *           example: "University of Southern California, CA"
 *     responses:
 *       200:
 *         description: Address geocoded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Address geocoded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: 34.0223519
 *                         longitude:
 *                           type: number
 *                           example: -118.285117
 *                     formattedAddress:
 *                       type: string
 *                       example: "Los Angeles, CA 90007, USA"
 *                     locationInfo:
 *                       type: object
 *                       properties:
 *                         city:
 *                           type: string
 *                           example: "Los Angeles"
 *                         state:
 *                           type: string
 *                           example: "California"
 *                         stateCode:
 *                           type: string
 *                           example: "CA"
 *                         country:
 *                           type: string
 *                           example: "United States"
 *                         countryCode:
 *                           type: string
 *                           example: "US"
 *       400:
 *         description: Bad request - missing or invalid address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: Geocoding service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/geocode", asyncHandler(eventsController.geocodeAddress));

/**
 * @swagger
 * /api/events/locations/suggest:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get location suggestions for autocomplete
 *     description: Get location suggestions based on partial address input for autocomplete functionality
 *     parameters:
 *       - name: input
 *         in: query
 *         required: true
 *         description: Partial address input for suggestions
 *         schema:
 *           type: string
 *           example: "Los Angel"
 *       - name: latitude
 *         in: query
 *         required: false
 *         description: Latitude for location bias
 *         schema:
 *           type: number
 *           example: 34.0522
 *       - name: longitude
 *         in: query
 *         required: false
 *         description: Longitude for location bias
 *         schema:
 *           type: number
 *           example: -118.2437
 *       - name: country
 *         in: query
 *         required: false
 *         description: Country code for filtering suggestions
 *         schema:
 *           type: string
 *           example: "US"
 *     responses:
 *       200:
 *         description: Location suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Location suggestions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     suggestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           formattedAddress:
 *                             type: string
 *                             example: "Los Angeles, CA, USA"
 *                           latitude:
 *                             type: number
 *                             example: 34.0522265
 *                           longitude:
 *                             type: number
 *                             example: -118.2436596
 *                           placeId:
 *                             type: string
 *                             example: "ChIJE9on3F3HwoAR9AhGJW_fL-I"
 *                           types:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["locality", "political"]
 *       400:
 *         description: Bad request - missing input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/locations/suggest",
  asyncHandler(eventsController.getLocationSuggestions),
);

module.exports = router;
