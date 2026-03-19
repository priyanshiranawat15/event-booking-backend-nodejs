const spotifyService = require('../services/spotifyService');

class ArtistsController {
  /**
   * Search for artists using Spotify API
   * GET /api/artists/search
   */
  async searchArtists(req, res) {
    try {
      const { artist } = req.query;

      if (!artist || artist.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Artist name parameter is required for artist search'
        });
      }

      if (artist.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Artist name must be at least 2 characters long'
        });
      }

      const result = await spotifyService.searchArtists(artist.trim());

      res.json({
        success: true,
        message: result.message,
        data: {
          artists: result.artists,
          total: result.total || result.artists.length,
          searchTerm: artist.trim()
        }
      });

    } catch (error) {
      console.error('Artists search controller error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to search artists',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get detailed information for a specific artist
   * GET /api/artists/:id
   */
  async getArtistDetails(req, res) {
    try {
      const { id } = req.params;

      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Artist ID is required'
        });
      }

      // Get artist details and albums
      const [artistResult, albumsResult] = await Promise.all([
        spotifyService.getMultipleArtists([id]),
        spotifyService.getArtistAlbums(id, 10)
      ]);

      if (!artistResult.artists || artistResult.artists.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Artist not found'
        });
      }

      const artist = artistResult.artists[0];

      res.json({
        success: true,
        message: 'Artist details retrieved successfully',
        data: {
          artist: artist,
          albums: albumsResult.albums || []
        }
      });

    } catch (error) {
      console.error('Artist details controller error:', error.message);

      if (error.message.includes('404') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Artist not found',
          error: 'The requested artist could not be found'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get artist details',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }
  }

  /**
   * Get albums for a specific artist
   * GET /api/artists/:id/albums
   */
  async getArtistAlbums(req, res) {
    try {
      const { id } = req.params;
      const { limit = '10' } = req.query;

      if (!id || id.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Artist ID is required'
        });
      }

      const albumLimit = Math.min(parseInt(limit) || 10, 50); // Max 50 albums
      const result = await spotifyService.getArtistAlbums(id, albumLimit);

      res.json({
        success: true,
        message: 'Artist albums retrieved successfully',
        data: {
          albums: result.albums,
          artistId: id,
          count: result.albums.length
        }
      });

    } catch (error) {
      console.error('Artist albums controller error:', error.message);

      if (error.message.includes('404') || error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Artist not found',
          error: 'The requested artist could not be found'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to get artist albums',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
      }
    }
  }

  /**
   * Get multiple artists by IDs
   * GET /api/artists/multiple
   */
  async getMultipleArtists(req, res) {
    try {
      const { ids } = req.query;

      if (!ids || ids.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Artist IDs parameter is required'
        });
      }

      // Parse comma-separated IDs
      const artistIds = ids.split(',').map(id => id.trim()).filter(id => id.length > 0);

      if (artistIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one valid artist ID is required'
        });
      }

      if (artistIds.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 50 artist IDs allowed per request'
        });
      }

      const result = await spotifyService.getMultipleArtists(artistIds);

      res.json({
        success: true,
        message: 'Multiple artists retrieved successfully',
        data: {
          artists: result.artists,
          requested: artistIds.length,
          found: result.artists.length
        }
      });

    } catch (error) {
      console.error('Multiple artists controller error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get multiple artists',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Health check for Spotify service
   * GET /api/artists/health
   */
  async healthCheck(req, res) {
    try {
      const spotifyHealth = await spotifyService.healthCheck();

      res.json({
        success: true,
        status: spotifyHealth.status,
        service: 'Spotify API',
        details: spotifyHealth,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Artists health check error:', error.message);
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        service: 'Spotify API',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clear Spotify token cache (useful for development/testing)
   * POST /api/artists/clear-cache
   */
  async clearTokenCache(req, res) {
    try {
      spotifyService.clearToken();

      res.json({
        success: true,
        message: 'Spotify token cache cleared successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Clear token cache error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to clear token cache',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get current Spotify token status (for debugging)
   * GET /api/artists/token-status
   */
  async getTokenStatus(req, res) {
    try {
      // Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Token status endpoint not available in production'
        });
      }

      const hasToken = !!spotifyService.accessToken;
      const tokenExpiresAt = spotifyService.tokenExpiresAt;
      const isTokenValid = hasToken && tokenExpiresAt && Date.now() < tokenExpiresAt;

      res.json({
        success: true,
        tokenStatus: {
          hasToken: hasToken,
          isValid: isTokenValid,
          expiresAt: tokenExpiresAt ? new Date(tokenExpiresAt).toISOString() : null,
          timeUntilExpiry: isTokenValid ? Math.round((tokenExpiresAt - Date.now()) / 1000) : null
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Token status error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get token status',
        error: error.message
      });
    }
  }
}

module.exports = new ArtistsController();
