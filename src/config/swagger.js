const swaggerJSDoc = require("swagger-jsdoc");
const config = require("./config");

// Basic Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Event Manager Backend API",
    version: "1.0.0",
    description:
      "A comprehensive backend service for event management with Ticketmaster and Spotify integration",
    contact: {
      name: "API Support",
      email: "support@eventmanager.com",
    },
    license: {
      name: "ISC",
      url: "https://opensource.org/licenses/ISC",
    },
  },
  servers: [
    {
      url: config.isDevelopment()
        ? `http://localhost:${config.port}`
        : "https://your-app.appspot.com",
      description: config.isDevelopment()
        ? "Development server"
        : "Production server",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Health check and system status endpoints",
    },
    {
      name: "Events",
      description: "Ticketmaster event management operations",
    },
    {
      name: "Artists",
      description: "Spotify artist information operations",
    },
    {
      name: "Favorites",
      description: "User favorites management operations",
    },
  ],
  components: {
    schemas: {
      // Common response schemas
      SuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation completed successfully",
          },
          data: {
            type: "object",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          message: {
            type: "string",
            example: "An error occurred",
          },
          error: {
            type: "string",
            example: "Detailed error message",
          },
        },
      },
      // Health check schema
      HealthResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          status: {
            type: "string",
            example: "healthy",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T00:00:00.000Z",
          },
          uptime: {
            type: "number",
            example: 123.45,
          },
          memory: {
            type: "object",
            properties: {
              rss: {
                type: "number",
              },
              heapTotal: {
                type: "number",
              },
              heapUsed: {
                type: "number",
              },
            },
          },
          version: {
            type: "string",
            example: "1.0.0",
          },
        },
      },
      // Event schemas
      EventSummary: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "G5vYZ9VJfenpl",
          },
          name: {
            type: "string",
            example: "Taylor Swift Concert",
          },
          date: {
            type: "string",
            format: "date",
            example: "2024-07-15",
          },
          time: {
            type: "string",
            example: "20:00",
          },
          venue: {
            $ref: "#/components/schemas/Venue",
          },
          genre: {
            type: "string",
            example: "Music",
          },
          subGenre: {
            type: "string",
            example: "Pop",
          },
          image: {
            type: "string",
            format: "uri",
            example: "https://example.com/image.jpg",
          },
          priceRange: {
            $ref: "#/components/schemas/PriceRange",
          },
          ticketStatus: {
            type: "string",
            example: "onsale",
          },
          url: {
            type: "string",
            format: "uri",
            example: "https://ticketmaster.com/event/123",
          },
        },
      },
      EventDetails: {
        allOf: [
          {
            $ref: "#/components/schemas/EventSummary",
          },
          {
            type: "object",
            properties: {
              description: {
                type: "string",
                example: "Join Taylor Swift for an unforgettable evening...",
              },
              dates: {
                type: "object",
                properties: {
                  start: {
                    type: "object",
                    properties: {
                      localDate: {
                        type: "string",
                        format: "date",
                      },
                      localTime: {
                        type: "string",
                      },
                      dateTime: {
                        type: "string",
                        format: "date-time",
                      },
                    },
                  },
                  timezone: {
                    type: "string",
                    example: "America/New_York",
                  },
                  status: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        example: "onsale",
                      },
                      message: {
                        type: "string",
                        example: "On Sale",
                      },
                    },
                  },
                },
              },
              artists: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/EventArtist",
                },
              },
              venue: {
                $ref: "#/components/schemas/VenueDetails",
              },
              priceRanges: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/PriceRange",
                },
              },
              social: {
                type: "object",
                properties: {
                  facebook: {
                    type: "string",
                    format: "uri",
                  },
                  twitter: {
                    type: "string",
                    format: "uri",
                  },
                  instagram: {
                    type: "string",
                    format: "uri",
                  },
                },
              },
            },
          },
        ],
      },
      Venue: {
        type: "object",
        properties: {
          name: {
            type: "string",
            example: "Madison Square Garden",
          },
          city: {
            type: "string",
            example: "New York",
          },
          state: {
            type: "string",
            example: "NY",
          },
        },
      },
      VenueDetails: {
        allOf: [
          {
            $ref: "#/components/schemas/Venue",
          },
          {
            type: "object",
            properties: {
              id: {
                type: "string",
                example: "KovZpZAJledA",
              },
              address: {
                type: "string",
                example: "4 Pennsylvania Plaza",
              },
              country: {
                type: "string",
                example: "United States",
              },
              postalCode: {
                type: "string",
                example: "10001",
              },
              location: {
                type: "object",
                properties: {
                  latitude: {
                    type: "number",
                    example: 40.7505,
                  },
                  longitude: {
                    type: "number",
                    example: -73.9934,
                  },
                },
              },
              image: {
                type: "string",
                nullable: true,
                example:
                  "https://s1.ticketm.net/dam/v/123/123abc-def4-5678-9012-123456789abc_456789_TABLET_LANDSCAPE_16_9.jpg",
              },
              images: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    url: {
                      type: "string",
                      example:
                        "https://s1.ticketm.net/dam/v/123/123abc-def4-5678-9012-123456789abc_456789_TABLET_LANDSCAPE_16_9.jpg",
                    },
                    width: {
                      type: "number",
                      example: 1024,
                    },
                    height: {
                      type: "number",
                      example: 576,
                    },
                    ratio: {
                      type: "string",
                      example: "16_9",
                    },
                  },
                },
              },
              boxOfficeInfo: {
                type: "object",
                nullable: true,
              },
              generalInfo: {
                type: "object",
                nullable: true,
              },
              parkingDetail: {
                type: "string",
                nullable: true,
              },
              accessibleSeatingDetail: {
                type: "string",
                nullable: true,
              },
              timezone: {
                type: "string",
                nullable: true,
                example: "America/New_York",
              },
              url: {
                type: "string",
                nullable: true,
                example: "https://www.ticketmaster.com/venue/123",
              },
              social: {
                type: "object",
                properties: {
                  facebook: {
                    type: "string",
                    nullable: true,
                  },
                  twitter: {
                    type: "string",
                    nullable: true,
                  },
                  instagram: {
                    type: "string",
                    nullable: true,
                  },
                },
              },
            },
          },
        ],
      },
      PriceRange: {
        type: "object",
        properties: {
          min: {
            type: "number",
            example: 50.0,
          },
          max: {
            type: "number",
            example: 250.0,
          },
          currency: {
            type: "string",
            example: "USD",
          },
        },
      },
      EventArtist: {
        type: "object",
        properties: {
          name: {
            type: "string",
            example: "Taylor Swift",
          },
          id: {
            type: "string",
            example: "K8vZ917G1V7",
          },
          type: {
            type: "string",
            example: "artist",
          },
          url: {
            type: "string",
            format: "uri",
          },
          image: {
            type: "string",
            format: "uri",
          },
        },
      },
      EventSearchResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Events retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              events: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/EventSummary",
                },
              },
              totalElements: {
                type: "number",
                example: 150,
              },
              totalPages: {
                type: "number",
                example: 8,
              },
              currentPage: {
                type: "number",
                example: 0,
              },
              size: {
                type: "number",
                example: 20,
              },
            },
          },
          searchParams: {
            type: "object",
            properties: {
              keyword: {
                type: "string",
                example: "Taylor Swift",
              },
              category: {
                type: "string",
                example: "music",
              },
              distance: {
                type: "string",
                example: "50",
              },
              hasLocation: {
                type: "boolean",
                example: true,
              },
            },
          },
        },
      },
      SuggestionsResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Suggestions retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      example: "Taylor Swift",
                    },
                    type: {
                      type: "string",
                      example: "attraction",
                    },
                    id: {
                      type: "string",
                      example: "K8vZ917G1V7",
                    },
                  },
                },
              },
            },
          },
        },
      },
      CategoryResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Event categories retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              categories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      example: "music",
                    },
                    name: {
                      type: "string",
                      example: "Music",
                    },
                    segmentId: {
                      type: "string",
                      example: "KZFzniwnSyZfZ7v7nJ",
                    },
                  },
                },
              },
            },
          },
        },
      },
      // Artist schemas
      SpotifyArtist: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "06HL4z0CvFAxyc27GXpf02",
          },
          name: {
            type: "string",
            example: "Taylor Swift",
          },
          popularity: {
            type: "number",
            example: 95,
          },
          followers: {
            type: "number",
            example: 50000000,
          },
          genres: {
            type: "array",
            items: {
              type: "string",
            },
            example: ["pop", "country"],
          },
          images: {
            type: "object",
            properties: {
              large: {
                type: "string",
                format: "uri",
              },
              medium: {
                type: "string",
                format: "uri",
              },
              small: {
                type: "string",
                format: "uri",
              },
            },
          },
          externalUrls: {
            type: "object",
            properties: {
              spotify: {
                type: "string",
                format: "uri",
                example:
                  "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02",
              },
            },
          },
        },
      },
      ArtistSearchResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Artists found successfully",
          },
          data: {
            type: "object",
            properties: {
              artists: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/SpotifyArtist",
                },
              },
              total: {
                type: "number",
                example: 50,
              },
              searchTerm: {
                type: "string",
                example: "Taylor Swift",
              },
            },
          },
        },
      },
      Album: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "1NAmidJlEaVgA3MpcPFYGq",
          },
          name: {
            type: "string",
            example: "Midnights",
          },
          type: {
            type: "string",
            example: "album",
          },
          releaseDate: {
            type: "string",
            format: "date",
            example: "2022-10-21",
          },
          totalTracks: {
            type: "number",
            example: 13,
          },
          images: {
            type: "object",
            properties: {
              large: {
                type: "string",
                format: "uri",
              },
              medium: {
                type: "string",
                format: "uri",
              },
              small: {
                type: "string",
                format: "uri",
              },
            },
          },
          externalUrls: {
            type: "object",
            properties: {
              spotify: {
                type: "string",
                format: "uri",
              },
            },
          },
        },
      },
      // Favorites schemas
      Favorite: {
        type: "object",
        required: ["eventId", "eventName", "venue"],
        properties: {
          id: {
            type: "string",
            example: "64a1b2c3d4e5f6789abcdef0",
          },
          eventId: {
            type: "string",
            example: "G5vYZ9VJfenpl",
          },
          eventName: {
            type: "string",
            example: "Taylor Swift Concert",
          },
          date: {
            type: "string",
            format: "date",
            example: "2024-07-15",
          },
          time: {
            type: "string",
            example: "20:00",
          },
          venue: {
            $ref: "#/components/schemas/Venue",
          },
          genre: {
            type: "string",
            example: "Music",
          },
          subGenre: {
            type: "string",
            example: "Pop",
          },
          image: {
            type: "string",
            format: "uri",
            example: "https://example.com/image.jpg",
          },
          priceRange: {
            $ref: "#/components/schemas/PriceRange",
          },
          ticketStatus: {
            type: "string",
            example: "onsale",
          },
          url: {
            type: "string",
            format: "uri",
            example: "https://ticketmaster.com/event/123",
          },
          dateAdded: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T00:00:00.000Z",
          },
          lastModified: {
            type: "string",
            format: "date-time",
            example: "2024-01-01T00:00:00.000Z",
          },
        },
      },
      FavoriteInput: {
        type: "object",
        required: ["eventId", "eventName", "venue"],
        properties: {
          eventId: {
            type: "string",
            example: "G5vYZ9VJfenpl",
          },
          eventName: {
            type: "string",
            example: "Taylor Swift Concert",
          },
          date: {
            type: "string",
            format: "date",
            example: "2024-07-15",
          },
          time: {
            type: "string",
            example: "20:00",
          },
          venue: {
            $ref: "#/components/schemas/Venue",
          },
          genre: {
            type: "string",
            example: "Music",
          },
          subGenre: {
            type: "string",
            example: "Pop",
          },
          image: {
            type: "string",
            format: "uri",
            example: "https://example.com/image.jpg",
          },
          priceRange: {
            $ref: "#/components/schemas/PriceRange",
          },
          ticketStatus: {
            type: "string",
            example: "onsale",
          },
          url: {
            type: "string",
            format: "uri",
            example: "https://ticketmaster.com/event/123",
          },
        },
      },
      FavoritesResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Favorites retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              favorites: {
                type: "array",
                items: {
                  $ref: "#/components/schemas/Favorite",
                },
              },
              count: {
                type: "number",
                example: 5,
              },
            },
          },
        },
      },
      FavoriteStatusResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Event is in favorites",
          },
          data: {
            type: "object",
            properties: {
              eventId: {
                type: "string",
                example: "G5vYZ9VJfenpl",
              },
              isFavorite: {
                type: "boolean",
                example: true,
              },
              favorite: {
                $ref: "#/components/schemas/Favorite",
              },
            },
          },
        },
      },
    },
    parameters: {
      EventIdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "Ticketmaster event ID",
        schema: {
          type: "string",
          example: "G5vYZ9VJfenpl",
        },
      },
      ArtistIdParam: {
        name: "id",
        in: "path",
        required: true,
        description: "Spotify artist ID",
        schema: {
          type: "string",
          example: "06HL4z0CvFAxyc27GXpf02",
        },
      },
      EventIdFavoriteParam: {
        name: "eventId",
        in: "path",
        required: true,
        description: "Ticketmaster event ID",
        schema: {
          type: "string",
          example: "G5vYZ9VJfenpl",
        },
      },
    },
  },
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
  swaggerDefinition,
};
