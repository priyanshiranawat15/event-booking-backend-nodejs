const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const config = require("./src/config/config");
const database = require("./src/config/database");
const apiRoutes = require("./src/routes/index");
const { swaggerSpec } = require("./src/config/swagger");
const {
  errorHandler,
  notFoundHandler,
  dbErrorHandler,
  externalAPIErrorHandler,
} = require("./src/middleware/errorHandler");

class Server {
  constructor() {
    this.app = express();
    this.port = config.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Trust proxy for accurate client IP addresses
    this.app.set("trust proxy", 1);

    // CORS configuration - Custom implementation to return exact headers
    this.app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, ngrok-skip-browser-warning, Accept",
      );
      res.header("Access-Control-Max-Age", "3600");

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Security headers
    this.app.use((req, res, next) => {
      res.header("X-Content-Type-Options", "nosniff");
      res.header("X-Frame-Options", "DENY");
      res.header("X-XSS-Protection", "1; mode=block");
      res.header("Referrer-Policy", "strict-origin-when-cross-origin");

      // Remove powered by header
      res.removeHeader("X-Powered-By");

      next();
    });

    // Request logging middleware
    this.app.use((req, res, next) => {
      console.log(
        `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`,
      );
      next();
    });

    // Static files middleware - serve frontend files
    this.app.use(
      express.static(path.join(__dirname, "public"), {
        maxAge: config.static.maxAge,
        etag: true,
        lastModified: true,
        setHeaders: (res, path) => {
          // Set cache headers based on file type
          if (path.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          } else if (path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)) {
            res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
          }
        },
      }),
    );

    // Rate limiting for API routes (optional)
    if (config.isProduction()) {
      const rateLimit = require("express-rate-limit");

      const apiLimiter = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.maxRequests,
        message: {
          success: false,
          message: "Too many requests from this IP, please try again later.",
          retryAfter: config.rateLimit.windowMs / 1000,
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      this.app.use("/api/", apiLimiter);
    }
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Swagger documentation
    this.app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "Event Manager API Documentation",
        swaggerOptions: {
          docExpansion: "list",
          filter: true,
          showRequestDuration: true,
        },
      }),
    );

    // Swagger JSON endpoint
    this.app.get("/api-docs.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.send(swaggerSpec);
    });

    // API routes
    this.app.use("/api", apiRoutes);

    // Health check endpoint (outside of API prefix for load balancers)
    this.app.get("/health", (req, res) => {
      res.json({
        success: true,
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: "1.0.0",
      });
    });

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "Event Manager Backend API",
        version: "1.0.0",
        description:
          "Backend service for event management with Ticketmaster and Spotify integration",
        endpoints: {
          api: "/api",
          health: "/health",
          documentation: "/api/info",
          swagger: "/api-docs",
        },
        timestamp: new Date().toISOString(),
      });
    });

    // Serve frontend application for all non-API routes (SPA routing)
    this.app.get("*", (req, res) => {
      // Only serve index.html for non-API routes
      if (!req.originalUrl.startsWith("/api")) {
        const indexPath = path.join(__dirname, "public", "index.html");

        // Check if index.html exists
        const fs = require("fs");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).json({
            success: false,
            message:
              "Frontend application not found. Please build and deploy the frontend.",
            hint: "Place your built frontend files in the public/ directory",
          });
        }
      } else {
        // Let the not found handler deal with API routes
        res.status(404).json({
          success: false,
          message: "API endpoint not found",
          availableEndpoints: "/api/info",
        });
      }
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // Database error handler
    this.app.use(dbErrorHandler);

    // External API error handlers
    this.app.use(externalAPIErrorHandler("Ticketmaster"));
    this.app.use(externalAPIErrorHandler("Spotify"));

    // 404 handler for API routes
    this.app.use("/api", notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      console.log("🚀 Starting Event Manager Backend...");

      // Validate configuration
      config.validateConfig();

      // Connect to database
      try {
        await database.connect();
      } catch (error) {
        console.warn(
          "⚠️  Database connection failed, continuing without database:",
          error.message,
        );
        if (config.isProduction()) {
          throw error;
        }
      }

      // Start server
      const server = this.app.listen(this.port, () => {
        console.log("✅ Server started successfully!");
        console.log(`🌐 Server running on port ${this.port}`);
        console.log(`🔗 Environment: ${config.nodeEnv}`);
        console.log(`📊 Database: ${config.mongodb.dbName}`);
        console.log(`🎯 API Base URL: http://localhost:${this.port}/api`);
        console.log(
          `📖 API Documentation: http://localhost:${this.port}/api/info`,
        );
        console.log(
          `📋 Swagger Documentation: http://localhost:${this.port}/api-docs`,
        );
        console.log(`💚 Health Check: http://localhost:${this.port}/health`);

        if (config.isProduction()) {
          console.log("🔒 Running in production mode");
        } else {
          console.log("🔧 Running in development mode");
          console.log(
            `🛠️  Sample URLs: http://localhost:${this.port}/api/sample-urls`,
          );
          console.log(
            `📚 Interactive API Docs: http://localhost:${this.port}/api-docs`,
          );
        }
      });

      // Store server instance globally for graceful shutdown
      global.server = server;

      // Handle server errors
      server.on("error", (error) => {
        if (error.code === "EADDRINUSE") {
          console.error(`❌ Port ${this.port} is already in use`);
        } else {
          console.error("❌ Server error:", error);
        }
        process.exit(1);
      });

      return server;
    } catch (error) {
      console.error("❌ Failed to start server:", error.message);
      process.exit(1);
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop() {
    try {
      console.log("🛑 Stopping server...");

      // Close database connection
      await database.disconnect();

      // Close server
      if (global.server) {
        await new Promise((resolve) => {
          global.server.close(resolve);
        });
      }

      console.log("✅ Server stopped successfully");
    } catch (error) {
      console.error("❌ Error stopping server:", error.message);
      throw error;
    }
  }
}

// Create and start server
const serverInstance = new Server();

// Start server if this file is run directly
if (require.main === module) {
  serverInstance.start().catch((error) => {
    console.error("❌ Failed to start application:", error);
    process.exit(1);
  });
}

module.exports = serverInstance;
