# Eurovision Twitter Monitor - Server Setup

## Installation

1. Install dependencies:
```bash
cd server
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Twitter Bearer Token. Only Bearer-token level access is required because the app falls back to search polling when streaming is unavailable and handles rate limits automatically. The token is never logged.

```
TWITTER_BEARER_TOKEN=your_actual_bearer_token_here
PORT=5000
NODE_ENV=development
```

## Running the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### Server-Sent Events (SSE)
- `GET /api/stream` - Real-time tweet streaming endpoint

### Stream Control
- `GET /api/stream/status` - Get stream status and hashtag info
- `POST /api/stream/start` - Start Twitter search polling
- `POST /api/stream/stop` - Stop Twitter search polling
- `GET /api/settings` - Retrieve current stream filters
- `POST /api/settings/update` - Update language or retweet filters
- `POST /api/settings/reset` - Restore default settings

### Hashtag Management
- `GET /api/hashtags` - Get current hashtags
- `POST /api/hashtags/add` - Add a hashtag (body: `{ "hashtag": "#Eurovision" }`)
- `POST /api/hashtags/remove` - Remove a hashtag (body: `{ "hashtag": "#Eurovision" }`)
- `POST /api/hashtags/update` - Update all hashtags (body: `{ "hashtags": ["#Eurovision", "#ESC2024"] }`)
- `POST /api/hashtags/reset` - Reset to default hashtags

### Health Check
- `GET /health` - Server health status

## Default Hashtags

The server starts with these default hashtags:
- #Eurovision
- #Eurovision2024
- #ESC2024
- #EurovisionSongContest

## Stream Filtering & Error Handling

Search polling applies:
- Hashtag clauses for the configured terms
- Optional language filters (`lang:en`, `lang:de`) unless testing mode is enabled
- Optional retweet exclusion (`-is:retweet`)
- Exponential backoff when Twitter returns other errors or rate-limit responses (HTTP 429)

The server cleanly stops polling on shutdown and notifies connected SSE clients about connection count and settings changes.
