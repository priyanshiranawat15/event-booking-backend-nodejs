const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const config = {
  // Server Configuration
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/eventmanager",
    dbName: process.env.DB_NAME || "eventmanager",
    collections: {
      favorites: process.env.DB_COLLECTION_FAVORITES || "favorites",
    },
    options: {
      retryWrites: true,
      w: "majority",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
    },
  },

  // Ticketmaster API Configuration
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY,
    baseUrl:
      process.env.TICKETMASTER_BASE_URL ||
      "https://app.ticketmaster.com/discovery/v2",
    endpoints: {
      events: "/events.json",
      suggest: "/suggest.json",
    },
    rateLimitPerSecond:
      parseInt(process.env.TICKETMASTER_RATE_LIMIT_PER_SECOND) || 5,
  },

  // Spotify API Configuration
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    baseUrl: process.env.SPOTIFY_BASE_URL || "https://api.spotify.com/v1",
    tokenUrl: "https://accounts.spotify.com/api/token",
    endpoints: {
      search: "/search",
    },
    tokenCacheTTL: parseInt(process.env.SPOTIFY_TOKEN_CACHE_TTL) || 3000, // 50 minutes (tokens expire in 1 hour)
    rateLimitPerSecond:
      parseInt(process.env.SPOTIFY_RATE_LIMIT_PER_SECOND) || 10,
  },

  // Google Maps API Configuration
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
    baseUrl:
      process.env.GOOGLE_MAPS_BASE_URL ||
      "https://maps.googleapis.com/maps/api",
    endpoints: {
      geocode: "/geocode/json",
      places: "/place",
    },
    rateLimitPerSecond:
      parseInt(process.env.GOOGLE_MAPS_RATE_LIMIT_PER_SECOND) || 50,
  },

  // CORS Configuration
  cors: {
    origin: "*", // Allow all origins
    credentials: false, // Set to false when using origin: "*"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "ngrok-skip-browser-warning", "Accept"],
    maxAge: 3600, // Cache preflight response for 1 hour
  },

  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || "fallback_jwt_secret_for_development",
    sessionSecret:
      process.env.SESSION_SECRET || "fallback_session_secret_for_development",
  },

  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Cache Configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
    checkperiod: 600, // 10 minutes
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.NODE_ENV === "production" ? "json" : "combined",
  },

  // Google Cloud Configuration
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    storageBucket: process.env.GCLOUD_STORAGE_BUCKET,
  },

  // Application Settings
  app: {
    name: "Event Manager Backend",
    version: "1.0.0",
    description:
      "Backend service for event management with Ticketmaster and Spotify integration",
  },

  // Static Files Configuration
  static: {
    directory: "public",
    maxAge: process.env.NODE_ENV === "production" ? 86400000 : 0, // 1 day in production, 0 in development
  },
};

// Validation function to check required environment variables
const validateConfig = () => {
  const requiredEnvVars = [];

  if (!config.ticketmaster.apiKey) {
    requiredEnvVars.push("TICKETMASTER_API_KEY");
  }

  if (!config.spotify.clientId) {
    requiredEnvVars.push("SPOTIFY_CLIENT_ID");
  }

  if (!config.spotify.clientSecret) {
    requiredEnvVars.push("SPOTIFY_CLIENT_SECRET");
  }

  if (!config.mongodb.uri || config.mongodb.uri.includes("username:password")) {
    requiredEnvVars.push("MONGODB_URI");
  }

  if (requiredEnvVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    requiredEnvVars.forEach((envVar) => {
      console.error(`   - ${envVar}`);
    });
    console.error(
      "\n📝 Please create a .env file based on .env.example and fill in the required values.",
    );

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn(
        "\n⚠️  Running in development mode with missing environment variables. Some features may not work.",
      );
    }
  }
};

// Helper function to check if we're in production
const isProduction = () => {
  return config.nodeEnv === "production";
};

// Helper function to check if we're in development
const isDevelopment = () => {
  return config.nodeEnv === "development";
};

// Export configuration object and helper functions
module.exports = {
  ...config,
  validateConfig,
  isProduction,
  isDevelopment,
};
