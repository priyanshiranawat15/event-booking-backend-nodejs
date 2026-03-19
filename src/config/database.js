const { MongoClient } = require("mongodb");
const config = require("./config");

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    try {
      console.log("🔄 Connecting to MongoDB...");

      this.client = new MongoClient(config.mongodb.uri, config.mongodb.options);

      await this.client.connect();

      // Test the connection
      await this.client.db("admin").command({ ping: 1 });

      this.db = this.client.db(config.mongodb.dbName);
      this.isConnected = true;

      console.log("✅ Successfully connected to MongoDB");
      console.log(`📊 Database: ${config.mongodb.dbName}`);

      // Create indexes for better performance
      await this.createIndexes();

      return this.db;
    } catch (error) {
      console.error("❌ MongoDB connection error:", error.message);
      this.isConnected = false;

      // In development, don't throw error to allow server to start
      if (config.isDevelopment()) {
        console.warn("⚠️  Running without database in development mode");
        return null;
      }

      throw error;
    }
  }

  /**
   * Create database indexes for optimized queries
   */
  async createIndexes() {
    try {
      if (!this.db) {
        console.warn("⚠️  Skipping index creation - database not available");
        return;
      }

      const favoritesCollection = this.db.collection(
        config.mongodb.collections.favorites,
      );

      // Create compound index for efficient querying
      await favoritesCollection.createIndex(
        { eventId: 1 },
        { unique: true, background: true },
      );

      // Create index for sorting by date added
      await favoritesCollection.createIndex(
        { dateAdded: 1 },
        { background: true },
      );

      console.log("📁 Database indexes created successfully");
    } catch (error) {
      console.warn(
        "⚠️  Warning: Could not create database indexes:",
        error.message,
      );
    }
  }

  /**
   * Get database instance
   */
  getDb() {
    if (!this.isConnected || !this.db) {
      if (config.isDevelopment()) {
        console.warn("⚠️  Database not available in development mode");
        return null;
      }
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  /**
   * Get specific collection
   */
  getCollection(collectionName) {
    const db = this.getDb();
    if (!db) {
      return null;
    }
    return db.collection(collectionName);
  }

  /**
   * Get favorites collection
   */
  getFavoritesCollection() {
    return this.getCollection(config.mongodb.collections.favorites);
  }

  /**
   * Check if database is connected
   */
  isDbConnected() {
    return this.isConnected && this.client && this.db;
  }

  /**
   * Close database connection
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        this.client = null;
        this.db = null;
        console.log("🔌 Disconnected from MongoDB");
      }
    } catch (error) {
      console.error("❌ Error disconnecting from MongoDB:", error.message);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      if (!this.isConnected) {
        throw new Error("Database not connected");
      }

      const result = await this.db.admin().ping();
      console.log("🏓 Database ping successful:", result);
      return true;
    } catch (error) {
      console.error("❌ Database ping failed:", error.message);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const db = this.getDb();
      const stats = await db.stats();
      return {
        dbName: stats.db,
        collections: stats.collections,
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        indexSize: stats.indexSize,
      };
    } catch (error) {
      console.error("❌ Error getting database stats:", error.message);
      throw error;
    }
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: "disconnected",
          message: "Database is not connected",
        };
      }

      const pingResult = await this.testConnection();
      if (pingResult) {
        const stats = await this.getStats();
        return {
          status: "healthy",
          message: "Database connection is healthy",
          details: {
            dbName: stats.dbName,
            collections: stats.collections,
          },
        };
      } else {
        return {
          status: "unhealthy",
          message: "Database ping failed",
        };
      }
    } catch (error) {
      return {
        status: "error",
        message: `Database health check failed: ${error.message}`,
      };
    }
  }
}

// Create singleton instance
const database = new Database();

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT. Gracefully shutting down...");
  await database.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Received SIGTERM. Gracefully shutting down...");
  await database.disconnect();
  process.exit(0);
});

module.exports = database;
