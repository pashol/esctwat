# Eurovision Twitter Monitor

A real-time web application that monitors X.com (Twitter) for Eurovision-related tweets in English and German. Built with React and Node.js, featuring a Twitter-like interface with dynamic hashtag filtering.

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
git clone <repository-url>
cd esctwat
```

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

### Backend (Node.js)
- **Express.js** - Web server and API endpoints
- **twitter-api-v2** - X.com API v2 integration
- **Server-Sent Events** - Real-time data streaming
- **Auto-reconnect** - Robust error handling and retry logic

### Frontend (React)
- **Modern React** - Hooks and functional components
- **Tailwind CSS** - Utility-first styling
- **EventSource API** - SSE client for real-time updates
- **Responsive Design** - Mobile-first approach

## API Endpoints

### Stream Control
- `GET /api/stream` - Server-Sent Events endpoint
- `GET /api/stream/status` - Stream status information
- `POST /api/stream/start` - Start Twitter streaming
- `POST /api/stream/stop` - Stop Twitter streaming

### Hashtag Management
- `GET /api/hashtags` - Get current hashtags
- `POST /api/hashtags/add` - Add new hashtag
- `POST /api/hashtags/remove` - Remove hashtag
- `POST /api/hashtags/update` - Update all hashtags

## Configuration

### Stream Filtering
The Twitter stream is filtered to show:
- **Languages**: English (`lang:en`) and German (`lang:de`) only
- **Content**: Original tweets only (`-is:retweet`)
- **Keywords**: Configurable hashtags

### Environment Variables
- `TWITTER_BEARER_TOKEN` - Your X.com API Bearer Token
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)

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
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # CSS/Tailwind styles
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── twitter/        # X.com API integration
│   │   ├── routes/         # API endpoints
│   │   └── app.js          # Main server file
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

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify your X.com API configuration
3. Check the browser console for errors
4. Ensure your Bearer Token is valid and active

---

**Enjoy monitoring Eurovision conversations in real-time! 🎤✨**