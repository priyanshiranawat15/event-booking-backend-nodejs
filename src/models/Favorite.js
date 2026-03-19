const { ObjectId } = require("mongodb");
const database = require("../config/database");
const config = require("../config/config");

class Favorite {
  constructor() {
    this.collectionName = config.mongodb.collections.favorites;
  }

  /**
   * Get the favorites collection
   */
  getCollection() {
    const collection = database.getFavoritesCollection();
    if (!collection) {
      throw new Error(
        "Database not available. Please check your database connection.",
      );
    }
    return collection;
  }

  /**
   * Add an event to favorites
   */
  async addFavorite(eventData) {
    try {
      if (!database.isDbConnected()) {
        throw new Error("Database not available. Cannot add favorite.");
      }

      const collection = this.getCollection();

      // Normalize the event data to handle both search API format (id/name) and favorites format (eventId/eventName)
      const normalizedData = this.normalizeEventData(eventData);

      // Check if event already exists in favorites
      const existingFavorite = await collection.findOne({
        eventId: normalizedData.eventId,
      });

      if (existingFavorite) {
        throw new Error("Event is already in favorites");
      }

      // Prepare favorite document
      const favoriteDoc = {
        eventId: normalizedData.eventId,
        eventName: normalizedData.eventName,
        date: normalizedData.date,
        time: normalizedData.time,
        venue: normalizedData.venue,
        genre: normalizedData.genre,
        subGenre: normalizedData.subGenre,
        image: normalizedData.image,
        images: normalizedData.images,
        priceRange: normalizedData.priceRange,
        ticketStatus: normalizedData.ticketStatus,
        url: normalizedData.url,
        dateAdded: new Date(),
        lastModified: new Date(),
      };

      // Insert the favorite
      const result = await collection.insertOne(favoriteDoc);

      if (!result.insertedId) {
        throw new Error("Failed to add favorite to database");
      }

      return {
        success: true,
        message: "Event added to favorites successfully",
        favoriteId: result.insertedId,
        favorite: favoriteDoc,
      };
    } catch (error) {
      console.error("Add favorite error:", error.message);
      throw error;
    }
  }

  /**
   * Get all favorites sorted by date added (oldest to newest as per requirements)
   */
  async getAllFavorites() {
    try {
      if (!database.isDbConnected()) {
        return {
          success: true,
          favorites: [],
          count: 0,
        };
      }

      const collection = this.getCollection();

      const favorites = await collection
        .find({})
        .sort({ dateAdded: 1 }) // 1 for ascending (oldest first)
        .toArray();

      return {
        success: true,
        favorites: favorites.map((fav) => this.formatFavorite(fav)),
        count: favorites.length,
      };
    } catch (error) {
      console.error("Get all favorites error:", error.message);
      throw new Error(`Failed to retrieve favorites: ${error.message}`);
    }
  }

  /**
   * Remove an event from favorites by eventId
   */
  async removeFavorite(eventId) {
    try {
      if (!database.isDbConnected()) {
        throw new Error("Database not available. Cannot remove favorite.");
      }

      const collection = this.getCollection();

      const result = await collection.deleteOne({ eventId: eventId });

      if (result.deletedCount === 0) {
        throw new Error("Event not found in favorites");
      }

      return {
        success: true,
        message: "Event removed from favorites successfully",
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error("Remove favorite error:", error.message);
      throw error;
    }
  }

  /**
   * Check if an event is in favorites
   */
  async isFavorite(eventId) {
    try {
      if (!database.isDbConnected()) {
        return {
          success: true,
          isFavorite: false,
          favorite: null,
        };
      }

      const collection = this.getCollection();

      const favorite = await collection.findOne({ eventId: eventId });

      return {
        success: true,
        isFavorite: !!favorite,
        favorite: favorite ? this.formatFavorite(favorite) : null,
      };
    } catch (error) {
      console.error("Check favorite error:", error.message);
      throw new Error(`Failed to check favorite status: ${error.message}`);
    }
  }

  /**
   * Get a specific favorite by eventId
   */
  async getFavoriteByEventId(eventId) {
    try {
      if (!database.isDbConnected()) {
        return {
          success: false,
          message: "Database not available",
          favorite: null,
        };
      }

      const collection = this.getCollection();

      const favorite = await collection.findOne({ eventId: eventId });

      if (!favorite) {
        return {
          success: false,
          message: "Favorite not found",
          favorite: null,
        };
      }

      return {
        success: true,
        favorite: this.formatFavorite(favorite),
      };
    } catch (error) {
      console.error("Get favorite by event ID error:", error.message);
      throw new Error(`Failed to get favorite: ${error.message}`);
    }
  }

  /**
   * Update a favorite (in case event details change)
   */
  async updateFavorite(eventId, updateData) {
    try {
      if (!database.isDbConnected()) {
        throw new Error("Database not available. Cannot update favorite.");
      }

      const collection = this.getCollection();

      const updateDoc = {
        ...updateData,
        lastModified: new Date(),
      };

      const result = await collection.updateOne(
        { eventId: eventId },
        { $set: updateDoc },
      );

      if (result.matchedCount === 0) {
        throw new Error("Favorite not found");
      }

      return {
        success: true,
        message: "Favorite updated successfully",
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      console.error("Update favorite error:", error.message);
      throw error;
    }
  }

  /**
   * Get favorites count
   */
  async getFavoritesCount() {
    try {
      if (!database.isDbConnected()) {
        return {
          success: true,
          count: 0,
        };
      }

      const collection = this.getCollection();
      const count = await collection.countDocuments({});

      return {
        success: true,
        count: count,
      };
    } catch (error) {
      console.error("Get favorites count error:", error.message);
      throw new Error(`Failed to get favorites count: ${error.message}`);
    }
  }

  /**
   * Clear all favorites (useful for testing)
   */
  async clearAllFavorites() {
    try {
      if (!database.isDbConnected()) {
        throw new Error("Database not available. Cannot clear favorites.");
      }

      const collection = this.getCollection();
      const result = await collection.deleteMany({});

      return {
        success: true,
        message: "All favorites cleared successfully",
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error("Clear all favorites error:", error.message);
      throw error;
    }
  }

  /**
   * Get favorites with pagination
   */
  async getFavoritesPaginated(page = 0, limit = 20) {
    try {
      if (!database.isDbConnected()) {
        return {
          success: true,
          favorites: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }

      const collection = this.getCollection();
      const skip = page * limit;

      const [favorites, totalCount] = await Promise.all([
        collection
          .find({})
          .sort({ dateAdded: 1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments({}),
      ]);

      return {
        success: true,
        favorites: favorites.map((fav) => this.formatFavorite(fav)),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: limit,
          hasNextPage: (page + 1) * limit < totalCount,
          hasPrevPage: page > 0,
        },
      };
    } catch (error) {
      console.error("Get paginated favorites error:", error.message);
      throw new Error(`Failed to get paginated favorites: ${error.message}`);
    }
  }

  /**
   * Format favorite document for API response
   */
  formatFavorite(favorite) {
    return {
      id: favorite._id,
      eventId: favorite.eventId,
      eventName: favorite.eventName,
      date: favorite.date,
      time: favorite.time,
      venue: favorite.venue,
      genre: favorite.genre,
      subGenre: favorite.subGenre,
      image: favorite.image,
      images: favorite.images || [],
      priceRange: favorite.priceRange,
      ticketStatus: favorite.ticketStatus,
      url: favorite.url,
      dateAdded: favorite.dateAdded,
      lastModified: favorite.lastModified,
    };
  }

  /**
   * Normalize event data to handle both search API format and favorites format
   */
  normalizeEventData(eventData) {
    return {
      eventId: eventData.eventId || eventData.id,
      eventName: eventData.eventName || eventData.name,
      date: eventData.date,
      time: eventData.time,
      venue: eventData.venue,
      genre: eventData.genre,
      subGenre: eventData.subGenre,
      image: eventData.image,
      images: eventData.images || [],
      priceRange: eventData.priceRange,
      ticketStatus: eventData.ticketStatus,
      url: eventData.url,
    };
  }

  /**
   * Validate favorite data before saving
   */
  validateFavoriteData(eventData) {
    const errors = [];

    // Accept both id/eventId and name/eventName formats
    const eventId = eventData.eventId || eventData.id;
    const eventName = eventData.eventName || eventData.name;

    if (!eventId) {
      errors.push("Event ID is required");
    }

    if (!eventName) {
      errors.push("Event name is required");
    }

    if (!eventData.venue) {
      errors.push("Venue information is required");
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return true;
  }

  /**
   * Bulk operations for favorites
   */
  async bulkAddFavorites(eventsData) {
    try {
      if (!database.isDbConnected()) {
        throw new Error("Database not available. Cannot bulk add favorites.");
      }

      const collection = this.getCollection();
      const operations = [];

      for (const eventData of eventsData) {
        this.validateFavoriteData(eventData);

        // Normalize the event data
        const normalizedData = this.normalizeEventData(eventData);

        operations.push({
          updateOne: {
            filter: { eventId: normalizedData.eventId },
            update: {
              $setOnInsert: {
                ...normalizedData,
                dateAdded: new Date(),
                lastModified: new Date(),
              },
            },
            upsert: true,
          },
        });
      }

      const result = await collection.bulkWrite(operations);

      return {
        success: true,
        message: "Bulk favorites operation completed",
        inserted: result.upsertedCount,
        modified: result.modifiedCount,
        matched: result.matchedCount,
      };
    } catch (error) {
      console.error("Bulk add favorites error:", error.message);
      throw error;
    }
  }
}

module.exports = new Favorite();
