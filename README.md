# Event Booking (Using Express and Node.js)

Event Booking is a Node.js + Express backend API for event discovery and favorites management.

It integrates with:
- Ticketmaster Discovery API for event data
- Spotify Web API for artist details
- Google Geocoding API for address-to-coordinate search
- MongoDB for storing favorites

## Features

- Event search with keyword, category, distance, and location filters
- Event autocomplete suggestions
- Event details with venue enrichment and Spotify artist data (when available)
- Artist search, artist details, and album retrieval
- Favorites CRUD, bulk add, export, and count
- Built-in API docs via Swagger UI
- Health/status endpoints for service monitoring

## Tech Stack

- Node.js 18+
- Express
- MongoDB (MongoDB Atlas or local MongoDB)
- Axios
- Swagger (`swagger-jsdoc`, `swagger-ui-express`)

## Project Structure

```text
assignment-3-backend/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
├── app.yaml
├── Dockerfile
├── deploy.sh
├── deploy-full.sh
├── server.js
├── setup.js
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- MongoDB connection string
- Ticketmaster API key
- Spotify Client ID and Client Secret
- Google Maps API key (for address geocoding)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your real credentials.

## Environment Variables

Required:
- `MONGODB_URI`
- `TICKETMASTER_API_KEY`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

Important optional values:
- `PORT` (default `8080`)
- `NODE_ENV` (`development` or `production`)
- `GOOGLE_MAPS_API_KEY` (required for address-based search)
- `DB_NAME` (default `eventmanager`)

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

Quick setup checks:

```bash
npm run setup:check
```

## API Entry Points

Base API URL: `http://localhost:8080/api`

General:
- `GET /health`
- `GET /api/health`
- `GET /api/status`
- `GET /api/info`
- `GET /api-docs`

Events:
- `GET /api/events/search`
- `GET /api/events/suggest`
- `GET /api/events/categories`
- `GET /api/events/health`
- `GET /api/events/geocode`
- `GET /api/events/:id`

Artists:
- `GET /api/artists/search`
- `GET /api/artists/multiple`
- `GET /api/artists/health`
- `POST /api/artists/clear-cache` (development only)
- `GET /api/artists/token-status` (development only)
- `GET /api/artists/:id`
- `GET /api/artists/:id/albums`

Favorites:
- `GET /api/favorites`
- `GET /api/favorites/count`
- `GET /api/favorites/export`
- `DELETE /api/favorites/clear` (development only)
- `GET /api/favorites/event/:eventId`
- `POST /api/favorites`
- `POST /api/favorites/bulk`
- `GET /api/favorites/:eventId`
- `PUT /api/favorites/:eventId`
- `DELETE /api/favorites/:eventId`

## Example Requests

Search events:

```bash
curl "http://localhost:8080/api/events/search?keyword=concert&category=music&distance=25&location=34.0224,-118.2851"
```

Search artists:

```bash
curl "http://localhost:8080/api/artists/search?artist=Taylor%20Swift"
```

Add favorite:

```bash
curl -X POST "http://localhost:8080/api/favorites" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "G5vYZ9VJfenpl",
    "eventName": "Taylor Swift | The Eras Tour",
    "venue": { "name": "MetLife Stadium", "city": "East Rutherford", "state": "NJ" },
    "date": "2026-07-15",
    "time": "20:00",
    "genre": "Music",
    "url": "https://www.ticketmaster.com/event/123"
  }'
```

## Deployment

Google App Engine:

```bash
gcloud app deploy
```

Cloud Run helper script:

```bash
chmod +x deploy.sh
./deploy.sh --cloud-run --project YOUR_PROJECT_ID
```

## Notes

- In development mode, missing API keys do not crash the app, but related endpoints may fail.
- In production mode, missing required configuration can stop startup.
- Static frontend assets can be served from `public/` if present.