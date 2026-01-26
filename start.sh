#!/bin/bash

echo "🎤 Eurovision Twitter Monitor - Fixed Version"
echo "=========================================="
echo ""

# Check if .env exists and has real token
if [ ! -f "server/.env" ]; then
    echo "⚠️  Environment file not found!"
    echo "Creating server/.env file..."
    cat > server/.env << EOF
# X.com API Configuration
# Replace YOUR_BEARER_TOKEN_HERE with your actual token from token.png
TWITTER_BEARER_TOKEN=YOUR_BEARER_TOKEN_HERE
PORT=5000
NODE_ENV=development
EOF
    echo "✅ Created server/.env file"
    echo "Please edit server/.env and add your actual Bearer Token"
    exit 1
fi

# Check if token is still placeholder
if grep -q "YOUR_BEARER_TOKEN_HERE" server/.env; then
    echo "⚠️  Please add your actual Bearer Token to server/.env"
    echo "Current token is still placeholder."
    echo ""
    echo "Edit server/.env and replace:"
    echo 'TWITTER_BEARER_TOKEN=YOUR_BEARER_TOKEN_HERE'
    echo ""
    echo "With your actual token from token.png"
    exit 1
fi

echo "✅ Environment file configured"

# Install dependencies if needed
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
echo "🚀 Starting fixed application..."
echo ""
echo "ℹ️  IMPORTANT: Using search polling instead of streaming"
echo "   - Updates every 10 seconds"
echo "   - Works with Bearer Token authentication"
echo "   - Real-time enough for monitoring"
echo ""
echo "The application will start with:"
echo "- Backend: http://localhost:5000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend server
cd server && npm run dev &
SERVER_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
cd client && npm start &
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

echo ""
echo "✨ If you see tweets appearing, it's working! 🎤✨"