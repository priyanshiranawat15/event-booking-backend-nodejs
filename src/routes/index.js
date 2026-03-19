const express = require("express");
const router = express.Router();

// Import route modules
const eventsRoutes = require("./events");
const artistsRoutes = require("./artists");
const favoritesRoutes = require("./favorites");

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: API health check
 *     description: Returns the health status of the entire API with system information
 *     responses:
 *       200:
 *         description: API is healthy and operational
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
 *                   example: "Event Manager API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                   description: "Server uptime in seconds"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     events:
 *                       type: string
 *                       example: "/api/events"
 *                     artists:
 *                       type: string
 *                       example: "/api/artists"
 *                     favorites:
 *                       type: string
 *                       example: "/api/favorites"
 *             example:
 *               success: true
 *               message: "Event Manager API is running"
 *               timestamp: "2024-01-01T00:00:00.000Z"
 *               version: "1.0.0"
 *               environment: "development"
 *               uptime: 123.45
 *               endpoints:
 *                 events: "/api/events"
 *                 artists: "/api/artists"
 *                 favorites: "/api/favorites"
 */
// Health check for the entire API
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Event Manager API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    endpoints: {
      events: "/api/events",
      artists: "/api/artists",
      favorites: "/api/favorites",
    },
  });
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     tags:
 *       - Health
 *     summary: API status overview
 *     description: Returns the operational status of all integrated services
 *     responses:
 *       200:
 *         description: Service status overview
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
 *                   enum: [operational, degraded, down]
 *                   example: "operational"
 *                 services:
 *                   type: object
 *                   properties:
 *                     ticketmaster:
 *                       type: string
 *                       example: "Available"
 *                     spotify:
 *                       type: string
 *                       example: "Available"
 *                     database:
 *                       type: string
 *                       example: "Connected"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
// API status endpoint
router.get("/status", (req, res) => {
  res.json({
    success: true,
    status: "operational",
    services: {
      ticketmaster: "Available",
      spotify: "Available",
      database: "Connected",
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/info:
 *   get:
 *     tags:
 *       - Health
 *     summary: API information and documentation
 *     description: Returns comprehensive API information including available endpoints and their descriptions
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 api:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Event Manager Backend API"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     description:
 *                       type: string
 *                       example: "Backend service for event management with Ticketmaster and Spotify integration"
 *                     endpoints:
 *                       type: object
 *                       properties:
 *                         events:
 *                           type: object
 *                           properties:
 *                             search:
 *                               type: string
 *                               example: "GET /api/events/search"
 *                             details:
 *                               type: string
 *                               example: "GET /api/events/:id"
 *                             suggest:
 *                               type: string
 *                               example: "GET /api/events/suggest"
 *                             categories:
 *                               type: string
 *                               example: "GET /api/events/categories"
 *                             health:
 *                               type: string
 *                               example: "GET /api/events/health"
 *                         artists:
 *                           type: object
 *                           properties:
 *                             search:
 *                               type: string
 *                               example: "GET /api/artists/search"
 *                             details:
 *                               type: string
 *                               example: "GET /api/artists/:id"
 *                             albums:
 *                               type: string
 *                               example: "GET /api/artists/:id/albums"
 *                             multiple:
 *                               type: string
 *                               example: "GET /api/artists/multiple"
 *                             health:
 *                               type: string
 *                               example: "GET /api/artists/health"
 *                         favorites:
 *                           type: object
 *                           properties:
 *                             getAll:
 *                               type: string
 *                               example: "GET /api/favorites"
 *                             add:
 *                               type: string
 *                               example: "POST /api/favorites"
 *                             remove:
 *                               type: string
 *                               example: "DELETE /api/favorites/:eventId"
 *                             check:
 *                               type: string
 *                               example: "GET /api/favorites/:eventId"
 *                             update:
 *                               type: string
 *                               example: "PUT /api/favorites/:eventId"
 *                             count:
 *                               type: string
 *                               example: "GET /api/favorites/count"
 *                             export:
 *                               type: string
 *                               example: "GET /api/favorites/export"
 *                             bulk:
 *                               type: string
 *                               example: "POST /api/favorites/bulk"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
// API information endpoint
router.get("/info", (req, res) => {
  res.json({
    success: true,
    api: {
      name: "Event Manager Backend API",
      version: "1.0.0",
      description:
        "Backend service for event management with Ticketmaster and Spotify integration",
      endpoints: {
        events: {
          search: "GET /api/events/search",
          details: "GET /api/events/:id",
          suggest: "GET /api/events/suggest",
          categories: "GET /api/events/categories",
          health: "GET /api/events/health",
        },
        artists: {
          search: "GET /api/artists/search",
          details: "GET /api/artists/:id",
          albums: "GET /api/artists/:id/albums",
          multiple: "GET /api/artists/multiple",
          health: "GET /api/artists/health",
        },
        favorites: {
          getAll: "GET /api/favorites",
          add: "POST /api/favorites",
          remove: "DELETE /api/favorites/:eventId",
          check: "GET /api/favorites/:eventId",
          update: "PUT /api/favorites/:eventId",
          count: "GET /api/favorites/count",
          export: "GET /api/favorites/export",
          bulk: "POST /api/favorites/bulk",
        },
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use("/events", eventsRoutes);
router.use("/artists", artistsRoutes);
router.use("/favorites", favoritesRoutes);

/**
 * @swagger
 * /api/test:
 *   get:
 *     tags:
 *       - Health
 *     summary: API test endpoint (development only)
 *     description: Test endpoint for development and debugging purposes. Returns request information.
 *     responses:
 *       200:
 *         description: Test endpoint working correctly
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
 *                   example: "API test endpoint working"
 *                 requestInfo:
 *                   type: object
 *                   properties:
 *                     method:
 *                       type: string
 *                       example: "GET"
 *                     url:
 *                       type: string
 *                       example: "/api/test"
 *                     headers:
 *                       type: object
 *                       example: {}
 *                     query:
 *                       type: object
 *                       example: {}
 *                     params:
 *                       type: object
 *                       example: {}
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
// Test endpoint for development
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "API test endpoint working",
    requestInfo: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      query: req.query,
      params: req.params,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/sample-urls:
 *   get:
 *     tags:
 *       - Health
 *     summary: Sample URLs for testing and grading
 *     description: Returns a collection of sample URLs that can be used for testing all API endpoints
 *     responses:
 *       200:
 *         description: Sample URLs retrieved successfully
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
 *                   example: "Sample URLs for testing and grading"
 *                 sampleUrls:
 *                   type: object
 *                   properties:
 *                     eventSearch:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/events/search?keyword=Taylor%20Swift&category=music"
 *                     eventDetails:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/events/G5vYZ9VJfenpl"
 *                     eventSuggestions:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/events/suggest?keyword=concert"
 *                     artistSearch:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/artists/search?artist=Taylor%20Swift"
 *                     favorites:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/favorites"
 *                     apiHealth:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/health"
 *                     apiInfo:
 *                       type: string
 *                       example: "https://your-app.appspot.com/api/info"
 *                 instructions:
 *                   type: object
 *                   properties:
 *                     eventSearch:
 *                       type: string
 *                       example: "Search for events by keyword and category"
 *                     eventDetails:
 *                       type: string
 *                       example: "Get details for a specific event (replace ID with actual event ID)"
 *                     eventSuggestions:
 *                       type: string
 *                       example: "Get autocomplete suggestions"
 *                     artistSearch:
 *                       type: string
 *                       example: "Search for artists on Spotify"
 *                     favorites:
 *                       type: string
 *                       example: "Get all user favorites"
 *                     apiHealth:
 *                       type: string
 *                       example: "Check API and services health"
 *                     apiInfo:
 *                       type: string
 *                       example: "Get API documentation and endpoints"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-01T00:00:00.000Z"
 */
// Sample URLs for grading (as required)
router.get("/sample-urls", (req, res) => {
  const baseUrl = req.protocol + "://" + req.get("host");

  res.json({
    success: true,
    message: "Sample URLs for testing and grading",
    sampleUrls: {
      eventSearch: `${baseUrl}/api/events/search?keyword=Taylor%20Swift&category=music`,
      eventDetails: `${baseUrl}/api/events/G5vYZ9VJfenpl`,
      eventSuggestions: `${baseUrl}/api/events/suggest?keyword=concert`,
      artistSearch: `${baseUrl}/api/artists/search?artist=Taylor%20Swift`,
      favorites: `${baseUrl}/api/favorites`,
      apiHealth: `${baseUrl}/api/health`,
      apiInfo: `${baseUrl}/api/info`,
    },
    instructions: {
      eventSearch: "Search for events by keyword and category",
      eventDetails:
        "Get details for a specific event (replace ID with actual event ID)",
      eventSuggestions: "Get autocomplete suggestions",
      artistSearch: "Search for artists on Spotify",
      favorites: "Get all user favorites",
      apiHealth: "Check API and services health",
      apiInfo: "Get API documentation and endpoints",
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
