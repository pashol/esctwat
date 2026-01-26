#!/bin/bash

echo "🎤 Eurovision Twitter Monitor - Setup Script"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Environment file not found!"
    echo "Please follow these steps:"
    echo ""
    echo "1. Copy server/.env.example to server/.env:"
    echo "   cp server/.env.example server/.env"
    echo ""
    echo "2. Edit server/.env and add your Twitter Bearer Token:"
    echo "   TWITTER_BEARER_TOKEN=your_bearer_token_here"
    echo ""
    echo "3. Run this setup script again"
    echo ""
    exit 1
fi

echo "✅ Environment file found"

# Check if dependencies are installed
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

echo "✅ Dependencies installed"

echo ""
echo "🚀 Starting application..."
echo ""
echo "The application will start with:"
echo "- Backend server: http://localhost:5000"
echo "- Frontend app: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers in parallel
cd server && npm run dev &
SERVER_PID=$!
cd ../client && npm start &
CLIENT_PID=$!

# Function to kill both processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for processes
wait