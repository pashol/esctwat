# Eurovision Twitter Monitor

[![Release v1.0.0](https://img.shields.io/badge/release-v1.0.0-blue.svg)](https://github.com/pashol/esctwat/releases/tag/v1.0.0)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://react.dev/)

A real-time web application that monitors X.com (Twitter) for Eurovision-related tweets in English and German. Built with React and Node.js, featuring a Twitter-like interface with dynamic hashtag filtering and Server-Sent Events for live updates.

## Features

🎤 **Real-time Streaming** - Live updates from X.com using Server-Sent Events  
🇬🇧🇩🇪 **Language Filtering** - Shows English and German tweets only  
🏷️ **Dynamic Hashtags** - Add/remove hashtags on the fly  
🎨 **Twitter-like UI** - Familiar interface with modern design  
🔄 **Auto-reconnect** - Robust connection handling with retry logic  
📱 **Responsive Design** - Works seamlessly on desktop and mobile  

## Quick Start

### Prerequisites

1. **X.com Developer Account** - Get a Bearer Token from [X Developer Portal](https://developer.x.com/)
2. **Node.js** (v16+) and npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/pashol/esctwat.git
cd esctwat
```

**Using setup script** (recommended - one command setup)
```bash
# Windows
setup.bat

# Linux/Mac
./setup.sh
```

**Or manual setup:**

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
```
Edit `.env` and add your Twitter Bearer Token:
```
TWITTER_BEARER_TOKEN=your_bearer_token_here
PORT=5000
NODE_ENV=development
```

4. **Setup Frontend**
```bash
cd ../client
npm install
```

### Running the Application

**Using start script** (recommended)
```bash
# Windows
start.bat

# Linux/Mac
./start.sh
```

**Or manually:**

1. **Start the backend server**
```bash
cd server
npm run dev
```
The server will start on `http://localhost:5000`

2. **Start the frontend** (in a new terminal)
```bash
cd client
npm start
```
The application will open at `http://localhost:3000`

## Usage

1. **Start the Stream** - Click "Start Stream" to begin monitoring tweets
2. **Add Hashtags** - Use the hashtag manager to add/remove keywords
3. **View Tweets** - See real-time updates in the Twitter-like interface
4. **Filtering** - Tweets are automatically filtered for English/German only

## Default Hashtags

The application starts with these hashtags:
- #Eurovision
- #Eurovision2024  
- #ESC2024
- #EurovisionSongContest

## Architecture

### Why Polling Instead of Streaming?
This app uses **search polling** (not filtered streaming) because the Twitter API's filtered stream requires OAuth 1.0a authentication, while this app uses simple Bearer Token authentication. Polling every 10 seconds provides a "real-time enough" experience with simpler setup.

### Backend (Node.js)
- **Express.js** - Web server and REST API endpoints
- **twitter-api-v2** - X.com API v2 integration
- **Server-Sent Events (SSE)** - Efficient one-way real-time data streaming
- **Polling System** - Configurable tweet polling with deduplication
- **Auto-reconnect** - Robust error handling and exponential backoff

### Frontend (React)
- **Modern React** - Hooks and functional components  
- **Tailwind CSS** - Utility-first responsive styling
- **EventSource API** - SSE client for real-time updates
- **Custom Hooks** - useTwitterStream for state management
- **Responsive Design** - Mobile-first approach with Twitter-like UI

## API Endpoints

### Stream Control
- `GET /api/stream` - Server-Sent Events endpoint for real-time tweets
- `GET /api/stream/status` - Stream status, hashtags, and client count
- `POST /api/stream/start` - Start Twitter polling
- `POST /api/stream/stop` - Stop Twitter polling

### Hashtag Management
- `GET /api/hashtags` - Get current hashtags
- `POST /api/hashtags/add` - Add new hashtag
- `POST /api/hashtags/remove` - Remove hashtag
- `POST /api/hashtags/update` - Update all hashtags
- `POST /api/hashtags/reset` - Reset to default hashtags

### Settings Management
- `GET /api/settings` - Get current settings
- `POST /api/settings/update` - Update languages, retweets, test mode, polling interval
- `POST /api/settings/reset` - Reset to defaults

### Tweets
- `GET /api/tweets/backfill` - Fetch recent tweets for initial display

## Configuration

### Stream Filtering
The Twitter stream is filtered to show:
- **Languages**: English (`lang:en`) and German (`lang:de`) only (configurable)
- **Content**: Original tweets only (`-is:retweet`) - toggle via UI
- **Keywords**: Configurable hashtags
- **Test Mode**: Disable language filters to test with any language

### Environment Variables (Server)
- `TWITTER_BEARER_TOKEN` - Your X.com API Bearer Token (required)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

### Runtime Settings (Configurable via UI)
- **Languages** - Toggle English/German filtering
- **Include Retweets** - Include or exclude retweets
- **Polling Interval** - Adjust tweet polling frequency (default: 10 seconds)
- **Test Mode** - Disable language filters for testing

## Troubleshooting

### Common Issues

**"Bearer Token Required"**
- Make sure to set `TWITTER_BEARER_TOKEN` in your `.env` file
- Verify your X.com Developer account is active

**No Tweets Appearing**
- Check if the stream is connected (green status indicator)
- Try adding more popular hashtags
- Verify your Bearer Token has proper permissions

**Connection Issues**
- The app automatically reconnects on connection failure
- Check your internet connection
- Verify X.com API service status

### Rate Limits

X.com API has rate limits:
- Filtered Stream: 300 requests/15-minute window
- The app implements proper rate limiting and backoff

## Development

### Project Structure
```
esctwat/
├── client/                           # React frontend
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── HashtagManager.jsx
│   │   │   ├── StreamSettings.jsx
│   │   │   ├── StreamStatus.jsx
│   │   │   ├── Tweet.jsx
│   │   │   └── Header.jsx
│   │   ├── hooks/
│   │   │   └── useTwitterStream.js   # SSE connection & state
│   │   └── styles/                   # CSS/Tailwind
│   └── package.json
├── server/                           # Node.js backend
│   ├── src/
│   │   ├── app.js                    # Main server & SSE endpoint
│   │   ├── settings.js               # Settings management
│   │   ├── twitter/
│   │   │   ├── client.js             # Twitter API polling logic
│   │   │   └── filters.js            # Hashtag validation
│   └── package.json
├── Dockerfile                        # Docker containerization
├── docker-compose.yml                # Multi-container setup
├── setup.sh / setup.bat              # Installation scripts
├── start.sh / start.bat              # Start scripts
└── README.md                         # This file
```

### Running in Development

```bash
# Backend with auto-reload
cd server && npm run dev

# Frontend with hot reload
cd client && npm start
```

### Deployment

#### Production Build

```bash
# Build frontend
cd client && npm run build

# Start backend in production mode
cd server && npm start
```

#### Deployment Options

1. **Vercel** - Frontend + Serverless Functions
2. **Render** - Full-stack deployment
3. **Docker** - Containerized deployment
4. **AWS/Azure/GCP** - Cloud deployment

## Docker Support

Run the entire application with Docker:

```bash
docker-compose up
```

This starts both frontend and backend in containers. The client will be available at `http://localhost:3000` and the API at `http://localhost:5000`.

See [DOCKER_README.md](DOCKER_README.md) for detailed Docker instructions.

## Performance & Limitations

- **Polling Interval**: Default 10 seconds (configurable via settings)
- **Rate Limiting**: Respects X.com API rate limits with automatic backoff
- **Deduplication**: Uses `since_id` to prevent duplicate tweets
- **Memory**: Efficient SSE streaming with automatic client cleanup
- **Scalability**: Suitable for small to medium deployments

## Additional Documentation

- **[CLAUDE.md](CLAUDE.md)** - Detailed architecture, state management, and implementation notes
- **[DOCKER_README.md](DOCKER_README.md)** - Docker and containerization guide
- **[Server README](server/README.md)** - Backend-specific documentation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## Roadmap

- [ ] OAuth 1.0a support for filtered streaming
- [ ] Tweet analytics and trending hashtags
- [ ] Tweet archive/search functionality
- [ ] Multi-language support expansion
- [ ] Database persistence layer
- [ ] Advanced filtering options
- [ ] User authentication and preferences

## License

MIT License - see [LICENSE](LICENSE) file for details

## Changelog

### [v1.0.0](https://github.com/pashol/esctwat/releases/tag/v1.0.0) - 2026-01-26
- Initial release with polling-based Twitter monitoring
- Real-time SSE streaming to connected clients
- Dynamic hashtag management
- Language and retweet filtering
- Configurable polling interval and settings
- Docker support
- Setup scripts for quick installation

## Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [CLAUDE.md](CLAUDE.md) for architecture details
3. Verify your X.com API Bearer Token is valid
4. Check server logs for API errors
5. Open an [Issue](https://github.com/pashol/esctwat/issues) on GitHub

---

**Enjoy monitoring Eurovision conversations in real-time! 🎤✨**