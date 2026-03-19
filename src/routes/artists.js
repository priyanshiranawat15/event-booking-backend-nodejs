const express = require("express");
const router = express.Router();
const artistsController = require("../controllers/artistsController");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @swagger
 * /api/artists/search:
 *   get:
 *     tags:
 *       - Artists
 *     summary: Search for artists using Spotify API
 *     description: Search for artists by name using Spotify's search API. Returns artist information including popularity, followers, genres, and images.
 *     parameters:
 *       - name: artist
 *         in: query
 *         required: true
 *         description: Artist name to search for (minimum 2 characters)
 *         schema:
 *           type: string
 *           minLength: 2
 *           example: "Taylor Swift"
 *     responses:
 *       200:
 *         description: Artists retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ArtistSearchResponse'
 *             examples:
 *               success:
 *                 summary: Artists found
 *                 value:
 *                   success: true
 *                   message: "Artists found successfully"
 *                   data:
 *                     artists:
 *                       - id: "06HL4z0CvFAxyc27GXpf02"
 *                         name: "Taylor Swift"
 *                         popularity: 95
 *                         followers: 50000000
 *                         genres: ["pop", "country"]
 *                         images:
 *                           large: "https://i.scdn.co/image/ab6761610000e5eba574c2ff91a8eb4ff96da89e"
 *                           medium: "https://i.scdn.co/image/ab67616100005174a574c2ff91a8eb4ff96da89e"
 *                           small: "https://i.scdn.co/image/ab67616100005174a574c2ff91a8eb4ff96da89e"
 *                         externalUrls:
 *                           spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02"
 *                         uri: "spotify:artist:06HL4z0CvFAxyc27GXpf02"
 *                         href: "https://api.spotify.com/v1/artists/06HL4z0CvFAxyc27GXpf02"
 *                     total: 50
 *                     searchTerm: "Taylor Swift"
 *               no_results:
 *                 summary: No artists found
 *                 value:
 *                   success: true
 *                   message: "No artists found"
 *                   data:
 *                     artists: []
 *                     total: 0
 *                     searchTerm: "unknown artist"
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_artist:
 *                 summary: Missing artist parameter
 *                 value:
 *                   success: false
 *                   message: "Artist name parameter is required for artist search"
 *               short_artist:
 *                 summary: Artist name too short
 *                 value:
 *                   success: false
 *                   message: "Artist name must be at least 2 characters long"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to search artists"
 *               error: "Spotify API error: Authentication failed"
 */
router.get("/search", asyncHandler(artistsController.searchArtists));

/**
 * @swagger
 * /api/artists/multiple:
 *   get:
 *     tags:
 *       - Artists
 *     summary: Get multiple artists by IDs
 *     description: Retrieve information for multiple artists using their Spotify IDs. Maximum 50 artists per request.
 *     parameters:
 *       - name: ids
 *         in: query
 *         required: true
 *         description: Comma-separated list of Spotify artist IDs (maximum 50)
 *         schema:
 *           type: string
 *           example: "06HL4z0CvFAxyc27GXpf02,4q3ewBCX7sLwd24euuV69X"
 *         style: form
 *         explode: false
 *     responses:
 *       200:
 *         description: Multiple artists retrieved successfully
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
 *                   example: "Multiple artists retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SpotifyArtist'
 *                     requested:
 *                       type: number
 *                       example: 2
 *                     found:
 *                       type: number
 *                       example: 2
 *             example:
 *               success: true
 *               message: "Multiple artists retrieved successfully"
 *               data:
 *                 artists:
 *                   - id: "06HL4z0CvFAxyc27GXpf02"
 *                     name: "Taylor Swift"
 *                     popularity: 95
 *                     followers: 50000000
 *                     genres: ["pop", "country"]
 *                   - id: "4q3ewBCX7sLwd24euuV69X"
 *                     name: "Bad Bunny"
 *                     popularity: 93
 *                     followers: 45000000
 *                     genres: ["reggaeton", "latin"]
 *                 requested: 2
 *                 found: 2
 *       400:
 *         description: Bad request - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_ids:
 *                 summary: Missing IDs parameter
 *                 value:
 *                   success: false
 *                   message: "Artist IDs parameter is required"
 *               too_many_ids:
 *                 summary: Too many IDs
 *                 value:
 *                   success: false
 *                   message: "Maximum 50 artist IDs allowed per request"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/multiple", asyncHandler(artistsController.getMultipleArtists));

/**
 * @swagger
 * /api/artists/health:
 *   get:
 *     tags:
 *       - Artists
 *       - Health
 *     summary: Health check for Spotify service
 *     description: Checks the health status of the Spotify API service including authentication status
 *     responses:
 *       200:
 *         description: Spotify service health status
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
 *                   enum: [healthy, unhealthy]
 *                   example: "healthy"
 *                 service:
 *                   type: string
 *                   example: "Spotify API"
 *                 details:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     message:
 *                       type: string
 *                       example: "Spotify API is accessible"
 *                     tokenStatus:
 *                       type: string
 *                       example: "valid"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *             examples:
 *               healthy:
 *                 summary: Service is healthy
 *                 value:
 *                   success: true
 *                   status: "healthy"
 *                   service: "Spotify API"
 *                   details:
 *                     status: "healthy"
 *                     message: "Spotify API is accessible"
 *                     tokenStatus: "valid"
 *                   timestamp: "2024-01-01T00:00:00.000Z"
 *               unhealthy:
 *                 summary: Service is unhealthy
 *                 value:
 *                   success: true
 *                   status: "unhealthy"
 *                   service: "Spotify API"
 *                   details:
 *                     status: "unhealthy"
 *                     message: "Spotify API error: Authentication failed"
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
 *                 service:
 *                   type: string
 *                   example: "Spotify API"
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
router.get("/health", asyncHandler(artistsController.healthCheck));

/**
 * @swagger
 * /api/artists/clear-cache:
 *   post:
 *     tags:
 *       - Artists
 *     summary: Clear Spotify token cache (development only)
 *     description: Clears the cached Spotify access token. This endpoint is only available in development mode and is useful for testing authentication flow.
 *     responses:
 *       200:
 *         description: Token cache cleared successfully
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
 *                   example: "Spotify token cache cleared successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *       403:
 *         description: Forbidden in production
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Clear cache endpoint not available in production"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/clear-cache", asyncHandler(artistsController.clearTokenCache));

/**
 * @swagger
 * /api/artists/token-status:
 *   get:
 *     tags:
 *       - Artists
 *     summary: Get current Spotify token status (development only)
 *     description: Returns the current status of the Spotify access token. This endpoint is only available in development mode for debugging purposes.
 *     responses:
 *       200:
 *         description: Token status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tokenStatus:
 *                   type: object
 *                   properties:
 *                     hasToken:
 *                       type: boolean
 *                       example: true
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T01:00:00.000Z"
 *                     timeUntilExpiry:
 *                       type: number
 *                       example: 3540
 *                       description: "Time until expiry in seconds"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *       403:
 *         description: Forbidden in production
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Token status endpoint not available in production"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/token-status", asyncHandler(artistsController.getTokenStatus));

/**
 * @swagger
 * /api/artists/{id}:
 *   get:
 *     tags:
 *       - Artists
 *     summary: Get detailed information for a specific artist
 *     description: Retrieves comprehensive artist information including details and recent albums from Spotify
 *     parameters:
 *       - $ref: '#/components/parameters/ArtistIdParam'
 *     responses:
 *       200:
 *         description: Artist details retrieved successfully
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
 *                   example: "Artist details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       $ref: '#/components/schemas/SpotifyArtist'
 *                     albums:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Album'
 *             example:
 *               success: true
 *               message: "Artist details retrieved successfully"
 *               data:
 *                 artist:
 *                   id: "06HL4z0CvFAxyc27GXpf02"
 *                   name: "Taylor Swift"
 *                   popularity: 95
 *                   followers: 50000000
 *                   genres: ["pop", "country"]
 *                   images:
 *                     large: "https://i.scdn.co/image/ab6761610000e5eba574c2ff91a8eb4ff96da89e"
 *                     medium: "https://i.scdn.co/image/ab67616100005174a574c2ff91a8eb4ff96da89e"
 *                     small: "https://i.scdn.co/image/ab67616100005174a574c2ff91a8eb4ff96da89e"
 *                   externalUrls:
 *                     spotify: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02"
 *                 albums:
 *                   - id: "1NAmidJlEaVgA3MpcPFYGq"
 *                     name: "Midnights"
 *                     type: "album"
 *                     releaseDate: "2022-10-21"
 *                     totalTracks: 13
 *                     images:
 *                       large: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5"
 *                     externalUrls:
 *                       spotify: "https://open.spotify.com/album/1NAmidJlEaVgA3MpcPFYGq"
 *       400:
 *         description: Bad request - invalid artist ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Artist ID is required"
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Artist not found"
 *               error: "The requested artist could not be found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", asyncHandler(artistsController.getArtistDetails));

/**
 * @swagger
 * /api/artists/{id}/albums:
 *   get:
 *     tags:
 *       - Artists
 *     summary: Get albums for a specific artist
 *     description: Retrieves album information for the specified artist including album details and release information
 *     parameters:
 *       - $ref: '#/components/parameters/ArtistIdParam'
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of albums to retrieve (maximum 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           example: 20
 *     responses:
 *       200:
 *         description: Artist albums retrieved successfully
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
 *                   example: "Artist albums retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     albums:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Album'
 *                     artistId:
 *                       type: string
 *                       example: "06HL4z0CvFAxyc27GXpf02"
 *                     count:
 *                       type: number
 *                       example: 10
 *             example:
 *               success: true
 *               message: "Artist albums retrieved successfully"
 *               data:
 *                 albums:
 *                   - id: "1NAmidJlEaVgA3MpcPFYGq"
 *                     name: "Midnights"
 *                     type: "album"
 *                     releaseDate: "2022-10-21"
 *                     totalTracks: 13
 *                     images:
 *                       large: "https://i.scdn.co/image/ab67616d0000b273bb54dde68cd23e2a268ae0f5"
 *                       medium: "https://i.scdn.co/image/ab67616d00001e02bb54dde68cd23e2a268ae0f5"
 *                       small: "https://i.scdn.co/image/ab67616d00004851bb54dde68cd23e2a268ae0f5"
 *                     externalUrls:
 *                       spotify: "https://open.spotify.com/album/1NAmidJlEaVgA3MpcPFYGq"
 *                   - id: "2QJmrSgbdM35R67eoGQo4j"
 *                     name: "Red (Taylor's Version)"
 *                     type: "album"
 *                     releaseDate: "2021-11-12"
 *                     totalTracks: 30
 *                 artistId: "06HL4z0CvFAxyc27GXpf02"
 *                 count: 2
 *       400:
 *         description: Bad request - invalid artist ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Artist not found
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
router.get("/:id/albums", asyncHandler(artistsController.getArtistAlbums));

module.exports = router;
