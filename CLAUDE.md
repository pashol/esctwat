# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Eurovision Twitter Monitor is a real-time web application that monitors X.com (Twitter) for Eurovision-related tweets. The app uses **search polling** (not filtered streaming) because the Twitter API's filtered stream requires OAuth 1.0a, while this app uses Bearer Token authentication for simplicity.

**Key Architecture Decision**: The app uses polling-based search (via Twitter API v2 search endpoint) instead of filtered streaming. This works with Bearer Token authentication and provides a "real-time enough" experience by polling every 10 seconds (configurable).

## Development Commands

### Initial Setup
```bash
# Windows
setup.bat

# Linux/Mac
./setup.sh

# Manual setup
cd server && npm install
cd client && npm install
```

### Running the Application
```bash
# Start both server and client (Windows)
start.bat

# Start both server and client (Linux/Mac)
./start.sh

# Manual - Server (port 5000)
cd server && npm run dev

# Manual - Client (port 3000)
cd client && npm start
```

### Testing
```bash
# Server side - no tests configured yet
cd server && npm test

# Client side - React tests
cd client && npm test
```

## Environment Configuration

The server requires a `.env` file in `server/` directory:
```
TWITTER_BEARER_TOKEN=your_bearer_token_here
PORT=5000
NODE_ENV=development
```

**Important**: Only Bearer Token authentication is required. The app handles API limitations automatically by using search polling instead of streaming.

## High-Level Architecture

### Server-Sent Events (SSE) Architecture

The app uses **SSE for real-time communication** from server to client:
1. Client connects to `/api/stream` SSE endpoint (server/src/app.js:71)
2. Server maintains a Set of all connected clients (server/src/app.js:20)
3. When Twitter polling finds new tweets, server broadcasts to all connected clients (server/src/app.js:165)
4. Client receives tweets via EventSource API (client/src/hooks/useTwitterStream.js:128)

### Twitter Polling System

Located in `server/src/twitter/client.js`:
- **Poll Interval**: Default 10 seconds, configurable via `StreamSettings`
- **Deduplication**: Uses `since_id` to track last seen tweet and avoid duplicates (client.js:86-87)
- **Error Handling**:
  - HTTP 429 (rate limit): Respects `retry-after` header
  - HTTP 401/403: Stops polling and reports authentication error
  - Other errors: Exponential backoff (client.js:120-144)

### State Management

The app has **three main state managers**:

1. **HashtagFilter** (`server/src/twitter/filters.js`): Manages hashtag list, validation, and normalization
2. **StreamSettings** (`server/src/settings.js`): Manages language filters, retweet inclusion, test mode, and polling interval
3. **useTwitterStream Hook** (`client/src/hooks/useTwitterStream.js`): Client-side state management for tweets, SSE connection, and UI state

### Query Building

Search queries are constructed in `TwitterClient.startPolling()` (client.js:63-76):
```javascript
// Example query: (#Eurovision OR #ESC2024) (lang:en OR lang:de) -is:retweet
const hashtagClause = hashtags.join(' OR ');  // Multiple hashtags OR'd together
const languageClause = languages.map(lang => `lang:${lang}`).join(' OR ');
const retweetFilter = '-is:retweet';  // Exclude retweets
```

**Test Mode**: When `testMode: true` in settings, language filters are disabled (useful for testing with any language).

### Connection State Broadcast

The server broadcasts connection state to all SSE clients when:
- A new client connects (app.js:92)
- Client count changes (app.js:45-58)
- Settings are updated (app.js:22-36)
- Stream starts/stops (app.js:220)

This keeps all connected clients synchronized on stream status and connected client count.

### Settings Changes and Stream Restart

When polling interval is changed via `/api/settings/update`, the server automatically restarts the polling loop to apply the new interval (app.js:321-361). Other setting changes (languages, includeRetweets) take effect on the next poll cycle without restart.

## API Endpoints

### Stream Control
- `GET /api/stream` - SSE endpoint for real-time tweet delivery
- `GET /api/stream/status` - Get current stream status, hashtags, and client count
- `POST /api/stream/start` - Start Twitter polling
- `POST /api/stream/stop` - Stop Twitter polling

### Hashtag Management
- `GET /api/hashtags` - Get current hashtags
- `POST /api/hashtags/add` - Add hashtag (body: `{ "hashtag": "#Eurovision" }`)
- `POST /api/hashtags/remove` - Remove hashtag
- `POST /api/hashtags/update` - Update all hashtags
- `POST /api/hashtags/reset` - Reset to defaults

### Settings Management
- `GET /api/settings` - Get current settings
- `POST /api/settings/update` - Update settings (languages, includeRetweets, testMode, pollingInterval)
- `POST /api/settings/reset` - Reset to defaults

### Tweets
- `GET /api/tweets/backfill` - Fetch recent tweets for initial display (called when stream starts)

## Important Implementation Details

### Hashtag Normalization
All hashtags are normalized to lowercase (filters.js:78-80). Input is cleaned to remove special characters, ensure # prefix, and validate minimum length.

### Tweet Formatting
Tweets from Twitter API are transformed in `formatTweetData()` (app.js:403-427) to extract:
- Tweet text, ID, timestamp, language
- Author info (username, name, profile image)
- Public metrics (likes, retweets, etc.)
- Entities (hashtags, mentions, URLs)

### Client-Side API URL Resolution
The client intelligently resolves API URLs (useTwitterStream.js:5-48):
- Uses `REACT_APP_API_BASE_URL` if set in environment
- Falls back to `localhost:5000` for local development
- Uses relative URLs for production deployment

### Graceful Shutdown
The server implements graceful shutdown (app.js:489-505):
- Stops Twitter polling
- Closes all SSE connections
- Closes HTTP server
- 10-second timeout before force exit

## Common Pitfalls

1. **SSE vs WebSocket**: This app uses SSE, not WebSocket. SSE is one-way (server to client) and sufficient for this use case.

2. **Streaming vs Polling**: The code mentions "streaming" in variable names and comments, but it's actually polling. This is intentional for compatibility with Bearer Token auth.

3. **EventSource and Proxies**: React's built-in proxy doesn't work well with EventSource. The client uses direct URLs to the backend (useTwitterStream.js:126).

4. **Client Restarts on Hashtag Changes**: When hashtags change while streaming, the client stops and restarts the stream (useTwitterStream.js:326). This is necessary to apply new hashtag filters to the Twitter search query.

5. **Backfill vs Live Tweets**: When starting the stream, the client first fetches ~20 recent tweets via `/api/tweets/backfill` for immediate display, then connects to SSE for live updates (useTwitterStream.js:255).

6. **Tweet Deduplication**: The `since_id` parameter ensures tweets are only delivered once, even across multiple poll cycles (client.js:86-87, 107-110).
