@echo off
echo 🎤 Eurovision Twitter Monitor - Fixed Version
echo ==========================================
echo.

REM Check if .env exists and has real token
if not exist "server\.env" (
    echo ⚠️  Environment file not found!
    echo Creating server\.env file...
    echo # X.com API Configuration > server\.env
    echo # Replace YOUR_BEARER_TOKEN_HERE with your actual token from token.png >> server\.env
    echo TWITTER_BEARER_TOKEN=YOUR_BEARER_TOKEN_HERE >> server\.env
    echo PORT=5000 >> server\.env
    echo NODE_ENV=development >> server\.env
    echo.
    echo ✅ Created server\.env file
    echo Please edit server\.env and add your actual Bearer Token
    pause
    exit /b 1
)

REM Check if token is still placeholder
findstr "YOUR_BEARER_TOKEN_HERE" server\.env >nul
if %errorlevel% == 0 (
    echo ⚠️  Please add your actual Bearer Token to server\.env
    echo Current token is still the placeholder.
    echo.
    echo Edit server\.env and replace:
    echo TWITTER_BEARER_TOKEN=YOUR_BEARER_TOKEN_HERE
    echo.
    echo With your actual token from token.png
    pause
    exit /b 1
)

echo ✅ Environment file configured

REM Install dependencies if needed
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server && npm install && cd ..
)

if not exist "client\node_modules" (
    echo 📦 Installing client dependencies...
    cd client && npm install && cd ..
)

echo ✅ Dependencies installed
echo.
echo 🚀 Starting fixed application...
echo.
echo ℹ️  IMPORTANT: Using search polling instead of streaming
echo    - Updates every 10 seconds
echo    - Works with Bearer Token authentication
echo    - Real-time enough for monitoring
echo.
echo The application will start with:
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Start backend server
start "Backend Server" /D server cmd /c "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
start "Frontend App" /D client cmd /c "npm start"

echo.
echo ✨ Both servers are starting in separate windows...
echo You can close this window now.
echo.
echo If you see tweets appearing, it's working! 🎤✨
pause