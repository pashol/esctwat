@echo off
REM Script to manually publish Docker image to GitHub Container Registry
REM Usage: docker-publish.bat [tag]

setlocal

set IMAGE_NAME=ghcr.io/pashol/esctwat
set TAG=%1
if "%TAG%"=="" set TAG=latest

echo ============================================
echo Publishing Docker Image to GitHub
echo ============================================
echo Image: %IMAGE_NAME%:%TAG%
echo.

REM Check if logged in to ghcr.io
echo [1/4] Checking Docker authentication...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    exit /b 1
)

echo.
echo [2/4] Building Docker image...
docker build -t %IMAGE_NAME%:%TAG% .
if errorlevel 1 (
    echo ERROR: Docker build failed!
    exit /b 1
)

echo.
echo [3/4] Tagging image as latest if needed...
if not "%TAG%"=="latest" (
    docker tag %IMAGE_NAME%:%TAG% %IMAGE_NAME%:latest
)

echo.
echo [4/4] Pushing to GitHub Container Registry...
echo.
echo NOTE: If you haven't logged in yet, run:
echo   echo YOUR_PAT ^| docker login ghcr.io -u pashol --password-stdin
echo.
echo Where YOUR_PAT is a Personal Access Token with write:packages scope
echo Create one at: https://github.com/settings/tokens
echo.

docker push %IMAGE_NAME%:%TAG%
if errorlevel 1 (
    echo ERROR: Docker push failed! Did you login to ghcr.io?
    exit /b 1
)

if not "%TAG%"=="latest" (
    docker push %IMAGE_NAME%:latest
)

echo.
echo ============================================
echo SUCCESS! Image published to:
echo   %IMAGE_NAME%:%TAG%
echo.
echo View at: https://github.com/pashol/esctwat/pkgs/container/esctwat
echo ============================================
