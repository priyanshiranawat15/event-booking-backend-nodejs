const axios = require('axios');
const config = require('../config/config');

class SpotifyService {
  constructor() {
    this.clientId = config.spotify.clientId;
    this.clientSecret = config.spotify.clientSecret;
    this.baseUrl = config.spotify.baseUrl;
    this.tokenUrl = config.spotify.tokenUrl;
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.rateLimitDelay = 1000 / config.spotify.rateLimitPerSecond;
    this.lastRequestTime = 0;
  }

  /**
   * Rate limiting to respect Spotify API limits
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Get OAuth access token using client credentials flow
   */
  async getAccessToken() {
    try {
      // Check if current token is still valid (with 5-minute buffer)
      const now = Date.now();
      if (this.accessToken && this.tokenExpiresAt && now < (this.tokenExpiresAt - 300000)) {
        return this.accessToken;
      }

      console.log('🔄 Requesting new Spotify access token...');

      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(this.tokenUrl,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = now + (response.data.expires_in * 1000); // Convert to milliseconds

      console.log('✅ Spotify access token obtained successfully');
      return this.accessToken;

    } catch (error) {
      console.error('❌ Spotify token request failed:', error.message);
      this.accessToken = null;
      this.tokenExpiresAt = null;

      if (error.response) {
        const { status, data } = error.response;
        throw new Error(`Spotify OAuth Error ${status}: ${data.error_description || data.error || error.message}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Spotify OAuth service');
      } else {
        throw new Error(`OAuth request error: ${error.message}`);
      }
    }
  }

  /**
   * Make authenticated request to Spotify API
   */
  async makeRequest(endpoint, params = {}) {
    try {
      await this.enforceRateLimit();

      const token = await this.getAccessToken();

      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params,
        timeout: 10000
      });

      return response.data;

    } catch (error) {
      console.error(`Spotify API Error (${endpoint}):`, error.message);

      if (error.response) {
        const { status, data } = error.response;

        // Handle token expiration
        if (status === 401) {
          this.accessToken = null;
          this.tokenExpiresAt = null;
          throw new Error('Spotify authentication failed. Token may be expired.');
        }

        throw new Error(`Spotify API Error ${status}: ${data.error?.message || error.message}`);
      } else if (error.request) {
        throw new Error('Network error: Unable to reach Spotify API');
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  }

  /**
   * Search for artists by name
   */
  async searchArtists(artistName) {
    try {
      if (!artistName || artistName.trim().length === 0) {
        return {
          artists: [],
          message: 'Artist name is required'
        };
      }

      const params = {
        q: artistName.trim(),
        type: 'artist',
        limit: 20 // Get multiple results to find best match
      };

      const data = await this.makeRequest('/search', params);

      if (!data.artists || !data.artists.items || data.artists.items.length === 0) {
        return {
          artists: [],
          message: 'No artists found'
        };
      }

      // Format and return artist information
      const artists = data.artists.items.map(artist => this.formatArtistInfo(artist));

      return {
        artists,
        total: data.artists.total,
        message: 'Artists found successfully'
      };

    } catch (error) {
      console.error('Artist search error:', error.message);
      throw new Error(`Failed to search artists: ${error.message}`);
    }
  }

  /**
   * Get best matching artist for an event (usually first result)
   */
  async getBestMatchingArtist(artistName) {
    try {
      const searchResult = await this.searchArtists(artistName);

      if (searchResult.artists.length === 0) {
        return null;
      }

      // Return the first (most relevant) result
      return searchResult.artists[0];

    } catch (error) {
      console.error('Best matching artist error:', error.message);
      return null; // Return null instead of throwing to avoid breaking event details
    }
  }

  /**
   * Format artist information
   */
  formatArtistInfo(artist) {
    return {
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity || 0,
      followers: artist.followers?.total || 0,
      genres: artist.genres || [],
      images: this.formatArtistImages(artist.images),
      externalUrls: {
        spotify: artist.external_urls?.spotify || null
      },
      uri: artist.uri,
      href: artist.href
    };
  }

  /**
   * Format artist images by size
   */
  formatArtistImages(images) {
    if (!images || images.length === 0) {
      return {
        large: null,
        medium: null,
        small: null
      };
    }

    // Sort images by size (largest to smallest)
    const sortedImages = images.sort((a, b) => (b.width || 0) - (a.width || 0));

    return {
      large: sortedImages[0]?.url || null,
      medium: sortedImages[1]?.url || sortedImages[0]?.url || null,
      small: sortedImages[2]?.url || sortedImages[sortedImages.length - 1]?.url || null
    };
  }

  /**
   * Get artist's top albums
   */
  async getArtistAlbums(artistId, limit = 10) {
    try {
      if (!artistId) {
        throw new Error('Artist ID is required');
      }

      const params = {
        include_groups: 'album,single',
        market: 'US',
        limit: limit
      };

      const data = await this.makeRequest(`/artists/${artistId}/albums`, params);

      if (!data.items) {
        return { albums: [] };
      }

      const albums = data.items.map(album => ({
        id: album.id,
        name: album.name,
        type: album.album_type,
        releaseDate: album.release_date,
        totalTracks: album.total_tracks,
        images: this.formatArtistImages(album.images),
        externalUrls: {
          spotify: album.external_urls?.spotify || null
        }
      }));

      return { albums };

    } catch (error) {
      console.error('Artist albums error:', error.message);
      return { albums: [] }; // Return empty array instead of throwing
    }
  }

  /**
   * Get multiple artists by IDs
   */
  async getMultipleArtists(artistIds) {
    try {
      if (!artistIds || artistIds.length === 0) {
        return { artists: [] };
      }

      // Spotify API allows up to 50 artists per request
      const ids = artistIds.slice(0, 50).join(',');
      const params = { ids };

      const data = await this.makeRequest('/artists', params);

      if (!data.artists) {
        return { artists: [] };
      }

      const artists = data.artists
        .filter(artist => artist !== null) // Filter out null results
        .map(artist => this.formatArtistInfo(artist));

      return { artists };

    } catch (error) {
      console.error('Multiple artists error:', error.message);
      return { artists: [] };
    }
  }

  /**
   * Check if an event is music-related based on genre/category
   */
  isMusicEvent(genre, category) {
    const musicKeywords = [
      'music', 'concert', 'festival', 'band', 'singer', 'musician',
      'rock', 'pop', 'jazz', 'classical', 'hip hop', 'rap', 'country',
      'electronic', 'dance', 'r&b', 'soul', 'blues', 'folk', 'reggae',
      'punk', 'metal', 'alternative', 'indie'
    ];

    const textToCheck = `${genre || ''} ${category || ''}`.toLowerCase();
    return musicKeywords.some(keyword => textToCheck.includes(keyword));
  }

  /**
   * Get artist information for an event (only if music-related)
   */
  async getArtistForEvent(artistName, eventGenre, eventCategory) {
    try {
      // Only search for artist if event is music-related
      if (!this.isMusicEvent(eventGenre, eventCategory)) {
        return null;
      }

      return await this.getBestMatchingArtist(artistName);

    } catch (error) {
      console.error('Get artist for event error:', error.message);
      return null;
    }
  }

  /**
   * Health check for Spotify API
   */
  async healthCheck() {
    try {
      // Test token acquisition
      const token = await this.getAccessToken();

      if (!token) {
        return {
          status: 'unhealthy',
          message: 'Unable to obtain Spotify access token'
        };
      }

      // Test a simple API call
      await this.makeRequest('/search', { q: 'test', type: 'artist', limit: 1 });

      return {
        status: 'healthy',
        message: 'Spotify API is accessible',
        tokenStatus: 'valid'
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Spotify API error: ${error.message}`
      };
    }
  }

  /**
   * Clear cached token (useful for testing)
   */
  clearToken() {
    this.accessToken = null;
    this.tokenExpiresAt = null;
    console.log('🔄 Spotify token cache cleared');
  }
}

module.exports = new SpotifyService();
