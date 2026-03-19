const Favorite = require("../models/Favorite");

class FavoritesController {
  /**
   * Get all favorites
   * GET /api/favorites
   */
  async getAllFavorites(req, res) {
    try {
      const { page, limit } = req.query;

      let result;
      if (page !== undefined || limit !== undefined) {
        // Paginated request
        const pageNumber = parseInt(page) || 0;
        const pageLimit = Math.min(parseInt(limit) || 20, 50); // Max 50 items per page
        result = await Favorite.getFavoritesPaginated(pageNumber, pageLimit);
      } else {
        // Get all favorites
        result = await Favorite.getAllFavorites();
      }

      res.json({
        success: true,
        message:
          result.favorites.length > 0
            ? "Favorites retrieved successfully"
            : "No favorites found",
        data: result,
      });
    } catch (error) {
      console.error("Get all favorites controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve favorites",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Add event to favorites
   * POST /api/favorites
   */
  async addFavorite(req, res) {
    try {
      const eventData = req.body;

      // Validate required fields - accept both search API format (id/name) and existing format (eventId/eventName)
      const eventId = eventData.eventId || eventData.id;
      const eventName = eventData.eventName || eventData.name;
      const venue = eventData.venue;

      if (!eventId || !eventName || !venue) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: eventId (or id), eventName (or name), and venue are required",
        });
      }

      // Validate eventData structure
      try {
        Favorite.validateFavoriteData(eventData);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message,
        });
      }

      const result = await Favorite.addFavorite(eventData);

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          favoriteId: result.favoriteId,
          favorite: result.favorite,
        },
      });
    } catch (error) {
      console.error("Add favorite controller error:", error.message);

      if (error.message.includes("already in favorites")) {
        res.status(409).json({
          success: false,
          message: "Event is already in favorites",
          error: "Duplicate favorite",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to add favorite",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
        });
      }
    }
  }

  /**
   * Remove event from favorites
   * DELETE /api/favorites/:eventId
   */
  async removeFavorite(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId || eventId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const result = await Favorite.removeFavorite(eventId);

      res.json({
        success: true,
        message: result.message,
        data: {
          eventId: eventId,
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      console.error("Remove favorite controller error:", error.message);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: "Event not found in favorites",
          error: "Favorite not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to remove favorite",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
        });
      }
    }
  }

  /**
   * Check if event is in favorites
   * GET /api/favorites/:eventId
   */
  async checkFavorite(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId || eventId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const result = await Favorite.isFavorite(eventId);

      res.json({
        success: true,
        message: result.isFavorite
          ? "Event is in favorites"
          : "Event is not in favorites",
        data: {
          eventId: eventId,
          isFavorite: result.isFavorite,
          favorite: result.favorite,
        },
      });
    } catch (error) {
      console.error("Check favorite controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to check favorite status",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Get a specific favorite by event ID
   * GET /api/favorites/event/:eventId
   */
  async getFavoriteByEventId(req, res) {
    try {
      const { eventId } = req.params;

      if (!eventId || eventId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      const result = await Favorite.getFavoriteByEventId(eventId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.message,
          data: null,
        });
      }

      res.json({
        success: true,
        message: "Favorite retrieved successfully",
        data: result.favorite,
      });
    } catch (error) {
      console.error(
        "Get favorite by event ID controller error:",
        error.message,
      );
      res.status(500).json({
        success: false,
        message: "Failed to get favorite",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Update a favorite
   * PUT /api/favorites/:eventId
   */
  async updateFavorite(req, res) {
    try {
      const { eventId } = req.params;
      const updateData = req.body;

      if (!eventId || eventId.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Event ID is required",
        });
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Update data is required",
        });
      }

      // Remove sensitive fields that shouldn't be updated
      const sanitizedUpdateData = { ...updateData };
      delete sanitizedUpdateData._id;
      delete sanitizedUpdateData.eventId;
      delete sanitizedUpdateData.dateAdded;

      const result = await Favorite.updateFavorite(
        eventId,
        sanitizedUpdateData,
      );

      res.json({
        success: true,
        message: result.message,
        data: {
          eventId: eventId,
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error) {
      console.error("Update favorite controller error:", error.message);

      if (error.message.includes("not found")) {
        res.status(404).json({
          success: false,
          message: "Favorite not found",
          error: "Favorite not found",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to update favorite",
          error:
            process.env.NODE_ENV === "development"
              ? error.message
              : "Internal server error",
        });
      }
    }
  }

  /**
   * Get favorites count
   * GET /api/favorites/count
   */
  async getFavoritesCount(req, res) {
    try {
      const result = await Favorite.getFavoritesCount();

      res.json({
        success: true,
        message: "Favorites count retrieved successfully",
        data: {
          count: result.count,
        },
      });
    } catch (error) {
      console.error("Get favorites count controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get favorites count",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Clear all favorites (useful for testing)
   * DELETE /api/favorites/clear
   */
  async clearAllFavorites(req, res) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === "production") {
        return res.status(403).json({
          success: false,
          message: "Clear all favorites operation not allowed in production",
        });
      }

      const result = await Favorite.clearAllFavorites();

      res.json({
        success: true,
        message: result.message,
        data: {
          deletedCount: result.deletedCount,
        },
      });
    } catch (error) {
      console.error("Clear all favorites controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to clear all favorites",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Bulk add favorites
   * POST /api/favorites/bulk
   */
  async bulkAddFavorites(req, res) {
    try {
      const { events } = req.body;

      if (!events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Events array is required and must not be empty",
        });
      }

      if (events.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Maximum 100 events allowed per bulk operation",
        });
      }

      const result = await Favorite.bulkAddFavorites(events);

      res.json({
        success: true,
        message: result.message,
        data: {
          inserted: result.inserted,
          modified: result.modified,
          matched: result.matched,
          total: events.length,
        },
      });
    } catch (error) {
      console.error("Bulk add favorites controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to bulk add favorites",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  /**
   * Export favorites (useful for backup)
   * GET /api/favorites/export
   */
  async exportFavorites(req, res) {
    try {
      const result = await Favorite.getAllFavorites();

      res.json({
        success: true,
        message: "Favorites exported successfully",
        data: {
          favorites: result.favorites,
          exportDate: new Date().toISOString(),
          count: result.count,
        },
      });
    } catch (error) {
      console.error("Export favorites controller error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to export favorites",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
}

module.exports = new FavoritesController();
