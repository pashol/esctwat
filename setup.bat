@echo off
echo 🎤 Eurovision Twitter Monitor - Setup Script
echo ======================================
echo.

REM Check if .env exists
if not exist "server\.env" (
    echo ⚠️  Environment file not found!
    echo Please follow these steps:
    echo.
    echo 1. Copy server\.env.example to server\.env:
    echo    copy server\.env.example server\.env
    echo.
    echo 2. Edit server\.env and add your Twitter Bearer Token:
    echo    TWITTER_BEARER_TOKEN=your_bearer_token_here
    echo.
    echo 3. Run this setup script again
    echo.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Check if dependencies are installed
if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo 📦 Installing client dependencies...
    cd client
    call npm install
    cd ..
)

echo ✅ Dependencies installed
echo.
echo 🚀 Starting application...
echo.
echo The application will start with:
echo - Backend server: http://localhost:5000
echo - Frontend app: http://localhost:3000
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
pause