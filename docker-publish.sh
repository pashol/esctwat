#!/bin/bash
# Script to manually publish Docker image to GitHub Container Registry
# Usage: ./docker-publish.sh [tag]

set -e

IMAGE_NAME="ghcr.io/pashol/esctwat"
TAG="${1:-latest}"

echo "============================================"
echo "Publishing Docker Image to GitHub"
echo "============================================"
echo "Image: ${IMAGE_NAME}:${TAG}"
echo ""

# Check if Docker is running
echo "[1/4] Checking Docker authentication..."
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running!"
    exit 1
fi

echo ""
echo "[2/4] Building Docker image..."
docker build -t "${IMAGE_NAME}:${TAG}" .

echo ""
echo "[3/4] Tagging image as latest if needed..."
if [ "$TAG" != "latest" ]; then
    docker tag "${IMAGE_NAME}:${TAG}" "${IMAGE_NAME}:latest"
fi

echo ""
echo "[4/4] Pushing to GitHub Container Registry..."
echo ""
echo "NOTE: If you haven't logged in yet, run:"
echo "  echo YOUR_PAT | docker login ghcr.io -u pashol --password-stdin"
echo ""
echo "Where YOUR_PAT is a Personal Access Token with write:packages scope"
echo "Create one at: https://github.com/settings/tokens"
echo ""

docker push "${IMAGE_NAME}:${TAG}"

if [ "$TAG" != "latest" ]; then
    docker push "${IMAGE_NAME}:latest"
fi

echo ""
echo "============================================"
echo "SUCCESS! Image published to:"
echo "  ${IMAGE_NAME}:${TAG}"
echo ""
echo "View at: https://github.com/pashol/esctwat/pkgs/container/esctwat"
echo "============================================"
