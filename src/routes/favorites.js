const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favoritesController");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Get all favorites sorted by date added (oldest first)
 *     description: Retrieves all user favorites sorted by date added in ascending order (oldest first). Supports optional pagination.
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number for pagination (0-based)
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 0
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of items per page (maximum 50)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *           example: 10
 *     responses:
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/FavoritesResponse'
 *                 - type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Favorites retrieved successfully"
 *                     data:
 *                       type: object
 *                       properties:
 *                         favorites:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Favorite'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: number
 *                               example: 0
 *                             totalPages:
 *                               type: number
 *                               example: 3
 *                             totalItems:
 *                               type: number
 *                               example: 25
 *                             itemsPerPage:
 *                               type: number
 *                               example: 10
 *                             hasNextPage:
 *                               type: boolean
 *                               example: true
 *                             hasPrevPage:
 *                               type: boolean
 *                               example: false
 *             examples:
 *               with_favorites:
 *                 summary: User has favorites
 *                 value:
 *                   success: true
 *                   message: "Favorites retrieved successfully"
 *                   data:
 *                     favorites:
 *                       - id: "64a1b2c3d4e5f6789abcdef0"
 *                         eventId: "G5vYZ9VJfenpl"
 *                         eventName: "Taylor Swift | The Eras Tour"
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
 *                         dateAdded: "2024-01-01T10:00:00.000Z"
 *                         lastModified: "2024-01-01T10:00:00.000Z"
 *                     count: 1
 *               no_favorites:
 *                 summary: User has no favorites
 *                 value:
 *                   success: true
 *                   message: "No favorites found"
 *                   data:
 *                     favorites: []
 *                     count: 0
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", asyncHandler(favoritesController.getAllFavorites));

/**
 * @swagger
 * /api/favorites/count:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Get total count of favorites
 *     description: Returns the total number of favorites for the user
 *     responses:
 *       200:
 *         description: Favorites count retrieved successfully
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
 *                   example: "Favorites count retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: number
 *                       example: 5
 *             example:
 *               success: true
 *               message: "Favorites count retrieved successfully"
 *               data:
 *                 count: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/count", asyncHandler(favoritesController.getFavoritesCount));

/**
 * @swagger
 * /api/favorites/export:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Export all favorites (for backup purposes)
 *     description: Exports all user favorites with metadata for backup or data portability purposes
 *     responses:
 *       200:
 *         description: Favorites exported successfully
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
 *                   example: "Favorites exported successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     favorites:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Favorite'
 *                     exportDate:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T00:00:00.000Z"
 *                     count:
 *                       type: number
 *                       example: 5
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/export", asyncHandler(favoritesController.exportFavorites));

/**
 * @swagger
 * /api/favorites/clear:
 *   delete:
 *     tags:
 *       - Favorites
 *     summary: Clear all favorites (development only)
 *     description: Removes all favorites from the database. This endpoint is only available in development mode for testing purposes.
 *     responses:
 *       200:
 *         description: All favorites cleared successfully
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
 *                   example: "All favorites cleared successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 5
 *       403:
 *         description: Forbidden in production
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Clear all favorites operation not allowed in production"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/clear", asyncHandler(favoritesController.clearAllFavorites));

/**
 * @swagger
 * /api/favorites/event/{eventId}:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Get a specific favorite by event ID
 *     description: Retrieves a specific favorite using the Ticketmaster event ID
 *     parameters:
 *       - $ref: '#/components/parameters/EventIdFavoriteParam'
 *     responses:
 *       200:
 *         description: Favorite retrieved successfully
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
 *                   example: "Favorite retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Favorite'
 *       404:
 *         description: Favorite not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Favorite not found"
 *                 data:
 *                   type: null
 *                   example: null
 *       400:
 *         description: Bad request - invalid event ID
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
  "/event/:eventId",
  asyncHandler(favoritesController.getFavoriteByEventId),
);

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     tags:
 *       - Favorites
 *     summary: Add event to favorites
 *     description: Adds a new event to the user's favorites list. Prevents duplicate favorites for the same event.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoriteInput'
 *           examples:
 *             music_event:
 *               summary: Music event favorite
 *               value:
 *                 eventId: "G5vYZ9VJfenpl"
 *                 eventName: "Taylor Swift | The Eras Tour"
 *                 date: "2024-07-15"
 *                 time: "20:00"
 *                 venue:
 *                   name: "MetLife Stadium"
 *                   city: "East Rutherford"
 *                   state: "NJ"
 *                 genre: "Music"
 *                 subGenre: "Pop"
 *                 image: "https://s1.ticketm.net/dam/a/123/abc123.jpg"
 *                 priceRange:
 *                   min: 75
 *                   max: 450
 *                   currency: "USD"
 *                 ticketStatus: "onsale"
 *                 url: "https://www.ticketmaster.com/event/123"
 *             sports_event:
 *               summary: Sports event favorite
 *               value:
 *                 eventId: "G5vYZ9VJfABCd"
 *                 eventName: "New York Yankees vs Boston Red Sox"
 *                 date: "2024-08-15"
 *                 time: "19:05"
 *                 venue:
 *                   name: "Yankee Stadium"
 *                   city: "Bronx"
 *                   state: "NY"
 *                 genre: "Sports"
 *                 subGenre: "Baseball"
 *                 image: "https://s1.ticketm.net/dam/b/456/def456.jpg"
 *                 priceRange:
 *                   min: 25
 *                   max: 150
 *                   currency: "USD"
 *                 ticketStatus: "onsale"
 *                 url: "https://www.ticketmaster.com/event/456"
 *     responses:
 *       201:
 *         description: Event added to favorites successfully
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
 *                   example: "Event added to favorites successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     favoriteId:
 *                       type: string
 *                       example: "64a1b2c3d4e5f6789abcdef0"
 *                     favorite:
 *                       $ref: '#/components/schemas/Favorite'
 *             example:
 *               success: true
 *               message: "Event added to favorites successfully"
 *               data:
 *                 favoriteId: "64a1b2c3d4e5f6789abcdef0"
 *                 favorite:
 *                   id: "64a1b2c3d4e5f6789abcdef0"
 *                   eventId: "G5vYZ9VJfenpl"
 *                   eventName: "Taylor Swift | The Eras Tour"
 *                   date: "2024-07-15"
 *                   time: "20:00"
 *                   venue:
 *                     name: "MetLife Stadium"
 *                     city: "East Rutherford"
 *                     state: "NJ"
 *                   genre: "Music"
 *                   dateAdded: "2024-01-01T10:00:00.000Z"
 *                   lastModified: "2024-01-01T10:00:00.000Z"
 *       400:
 *         description: Bad request - missing required fields or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_fields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "Missing required fields: eventId, eventName"
 *               validation_error:
 *                 summary: Validation error
 *                 value:
 *                   success: false
 *                   message: "Validation failed: Event ID is required, Event name is required"
 *       409:
 *         description: Conflict - event already in favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Event is already in favorites"
 *               error: "Duplicate favorite"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", asyncHandler(favoritesController.addFavorite));

/**
 * @swagger
 * /api/favorites/bulk:
 *   post:
 *     tags:
 *       - Favorites
 *     summary: Bulk add multiple events to favorites
 *     description: Adds multiple events to favorites in a single operation. Supports up to 100 events per request with upsert functionality.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - events
 *             properties:
 *               events:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/FavoriteInput'
 *                 maxItems: 100
 *                 description: Array of event data objects (maximum 100)
 *           example:
 *             events:
 *               - eventId: "G5vYZ9VJfenpl"
 *                 eventName: "Taylor Swift | The Eras Tour"
 *                 venue:
 *                   name: "MetLife Stadium"
 *                   city: "East Rutherford"
 *                   state: "NJ"
 *                 genre: "Music"
 *               - eventId: "G5vYZ9VJfABCd"
 *                 eventName: "Yankees vs Red Sox"
 *                 venue:
 *                   name: "Yankee Stadium"
 *                   city: "Bronx"
 *                   state: "NY"
 *                 genre: "Sports"
 *     responses:
 *       200:
 *         description: Bulk favorites operation completed
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
 *                   example: "Bulk favorites operation completed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     inserted:
 *                       type: number
 *                       example: 2
 *                       description: "Number of new favorites added"
 *                     modified:
 *                       type: number
 *                       example: 0
 *                       description: "Number of existing favorites updated"
 *                     matched:
 *                       type: number
 *                       example: 0
 *                       description: "Number of existing favorites matched"
 *                     total:
 *                       type: number
 *                       example: 2
 *                       description: "Total number of events processed"
 *       400:
 *         description: Bad request - invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_events:
 *                 summary: Missing events array
 *                 value:
 *                   success: false
 *                   message: "Events array is required and must not be empty"
 *               too_many_events:
 *                 summary: Too many events
 *                 value:
 *                   success: false
 *                   message: "Maximum 100 events allowed per bulk operation"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/bulk", asyncHandler(favoritesController.bulkAddFavorites));

/**
 * @swagger
 * /api/favorites/{eventId}:
 *   get:
 *     tags:
 *       - Favorites
 *     summary: Check if specific event is in favorites
 *     description: Checks whether a specific event is in the user's favorites list and returns the favorite status
 *     parameters:
 *       - $ref: '#/components/parameters/EventIdFavoriteParam'
 *     responses:
 *       200:
 *         description: Favorite status checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FavoriteStatusResponse'
 *             examples:
 *               is_favorite:
 *                 summary: Event is in favorites
 *                 value:
 *                   success: true
 *                   message: "Event is in favorites"
 *                   data:
 *                     eventId: "G5vYZ9VJfenpl"
 *                     isFavorite: true
 *                     favorite:
 *                       id: "64a1b2c3d4e5f6789abcdef0"
 *                       eventId: "G5vYZ9VJfenpl"
 *                       eventName: "Taylor Swift | The Eras Tour"
 *                       dateAdded: "2024-01-01T10:00:00.000Z"
 *               not_favorite:
 *                 summary: Event is not in favorites
 *                 value:
 *                   success: true
 *                   message: "Event is not in favorites"
 *                   data:
 *                     eventId: "G5vYZ9VJfenpl"
 *                     isFavorite: false
 *                     favorite: null
 *       400:
 *         description: Bad request - invalid event ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Event ID is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   put:
 *     tags:
 *       - Favorites
 *     summary: Update a favorite event
 *     description: Updates specific fields of an existing favorite event. Cannot update eventId or dateAdded.
 *     parameters:
 *       - $ref: '#/components/parameters/EventIdFavoriteParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventName:
 *                 type: string
 *                 example: "Updated Event Name"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-07-20"
 *               time:
 *                 type: string
 *                 example: "21:00"
 *               venue:
 *                 $ref: '#/components/schemas/Venue'
 *               genre:
 *                 type: string
 *                 example: "Music"
 *               subGenre:
 *                 type: string
 *                 example: "Pop"
 *               image:
 *                 type: string
 *                 format: uri
 *                 example: "https://updated-image.jpg"
 *               priceRange:
 *                 $ref: '#/components/schemas/PriceRange'
 *               ticketStatus:
 *                 type: string
 *                 example: "soldout"
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: "https://updated-url.com"
 *           example:
 *             eventName: "Taylor Swift | The Eras Tour - Updated"
 *             date: "2024-07-20"
 *             time: "21:00"
 *             ticketStatus: "soldout"
 *     responses:
 *       200:
 *         description: Favorite updated successfully
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
 *                   example: "Favorite updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       example: "G5vYZ9VJfenpl"
 *                     modifiedCount:
 *                       type: number
 *                       example: 1
 *       400:
 *         description: Bad request - invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_event_id:
 *                 summary: Missing event ID
 *                 value:
 *                   success: false
 *                   message: "Event ID is required"
 *               no_update_data:
 *                 summary: No update data provided
 *                 value:
 *                   success: false
 *                   message: "Update data is required"
 *       404:
 *         description: Favorite not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Favorite not found"
 *               error: "Favorite not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags:
 *       - Favorites
 *     summary: Remove event from favorites
 *     description: Removes a specific event from the user's favorites list using the Ticketmaster event ID
 *     parameters:
 *       - $ref: '#/components/parameters/EventIdFavoriteParam'
 *     responses:
 *       200:
 *         description: Event removed from favorites successfully
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
 *                   example: "Event removed from favorites successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     eventId:
 *                       type: string
 *                       example: "G5vYZ9VJfenpl"
 *                     deletedCount:
 *                       type: number
 *                       example: 1
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
 *         description: Event not found in favorites
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Event not found in favorites"
 *               error: "Favorite not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:eventId", asyncHandler(favoritesController.checkFavorite));
router.put("/:eventId", asyncHandler(favoritesController.updateFavorite));
router.delete("/:eventId", asyncHandler(favoritesController.removeFavorite));

module.exports = router;
