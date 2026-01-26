# Docker Deployment Guide

This guide explains how to publish and deploy the Eurovision Twitter Monitor Docker image to GitHub Container Registry (ghcr.io).

## Table of Contents
- [Quick Start](#quick-start)
- [Option 1: Automated Publishing (Recommended)](#option-1-automated-publishing-recommended)
- [Option 2: Manual Publishing](#option-2-manual-publishing)
- [Running the Published Image](#running-the-published-image)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

The Docker image is automatically built and published to GitHub Container Registry when you push to the main branch.

**Pull and run the latest image:**
```bash
docker pull ghcr.io/pashol/esctwat:latest
docker run -p 3000:3000 -p 5000:5000 -e TWITTER_BEARER_TOKEN=your_token ghcr.io/pashol/esctwat:latest
```

---

## Option 1: Automated Publishing (Recommended)

GitHub Actions automatically builds and publishes the Docker image on:
- **Push to main/master branch** → Tagged as `latest`
- **Push tags** (e.g., `v1.0.0`) → Tagged with version number
- **Pull requests** → Built but not published (for testing)

### Setup Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Add Docker publishing workflow"
   git push origin main
   ```

2. **GitHub Actions will automatically:**
   - Build the Docker image
   - Push it to `ghcr.io/pashol/esctwat`
   - Tag it appropriately

3. **Monitor the workflow:**
   - Visit: https://github.com/pashol/esctwat/actions
   - Check the "Docker Image CI/CD" workflow

### Publishing Versioned Releases

To publish a specific version:
```bash
git tag v1.0.0
git push origin v1.0.0
```

This creates images tagged as:
- `ghcr.io/pashol/esctwat:v1.0.0`
- `ghcr.io/pashol/esctwat:1.0.0`
- `ghcr.io/pashol/esctwat:1.0`
- `ghcr.io/pashol/esctwat:1`
- `ghcr.io/pashol/esctwat:latest` (if on main branch)

---

## Option 2: Manual Publishing

For manual local publishing, use the provided scripts.

### Prerequisites

1. **Create a Personal Access Token (PAT):**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `write:packages`, `read:packages`
   - Save the token securely

2. **Login to GitHub Container Registry:**
   ```bash
   # Windows (PowerShell)
   $env:CR_PAT | docker login ghcr.io -u pashol --password-stdin
   
   # Linux/Mac
   echo $CR_PAT | docker login ghcr.io -u pashol --password-stdin
   ```

### Publishing with Scripts

**Windows:**
```bash
# Publish as latest
docker-publish.bat

# Publish with specific tag
docker-publish.bat v1.0.0
```

**Linux/Mac:**
```bash
# Publish as latest
./docker-publish.sh

# Publish with specific tag
./docker-publish.sh v1.0.0
```

### Manual Publishing (Without Scripts)

```bash
# Build the image
docker build -t ghcr.io/pashol/esctwat:latest .

# Tag with version (optional)
docker tag ghcr.io/pashol/esctwat:latest ghcr.io/pashol/esctwat:v1.0.0

# Push to registry
docker push ghcr.io/pashol/esctwat:latest
docker push ghcr.io/pashol/esctwat:v1.0.0
```

---

## Running the Published Image

### Basic Usage

```bash
docker run -d \
  -p 3000:3000 \
  -p 5000:5000 \
  -e TWITTER_BEARER_TOKEN=your_bearer_token_here \
  --name esctwat \
  ghcr.io/pashol/esctwat:latest
```

### With Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  esctwat:
    image: ghcr.io/pashol/esctwat:latest
    ports:
      - "3000:3000"  # Frontend
      - "5000:5000"  # Backend API
    environment:
      - TWITTER_BEARER_TOKEN=${TWITTER_BEARER_TOKEN}
      - NODE_ENV=production
      - PORT=5000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/api/stream/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

Run with:
```bash
docker-compose up -d
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/stream/status

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TWITTER_BEARER_TOKEN` | Yes | - | Twitter API Bearer Token |
| `PORT` | No | 5000 | Backend server port |
| `NODE_ENV` | No | production | Node environment |

### Ports

| Port | Service | Description |
|------|---------|-------------|
| 3000 | Frontend | React application |
| 5000 | Backend | Node.js API server |

---

## Troubleshooting

### Image Not Found
If you get "image not found" error, the package might be private:
1. Go to: https://github.com/pashol/esctwat/pkgs/container/esctwat
2. Click "Package settings"
3. Change visibility to "Public"

### Authentication Failed
```bash
# Re-login to GitHub Container Registry
echo YOUR_PAT | docker login ghcr.io -u pashol --password-stdin
```

### Build Fails in GitHub Actions
- Check the Actions log: https://github.com/pashol/esctwat/actions
- Ensure the Dockerfile is valid
- Check for sufficient disk space in the runner

### Container Won't Start
```bash
# Check logs
docker logs esctwat

# Common issues:
# - Missing TWITTER_BEARER_TOKEN environment variable
# - Ports 3000 or 5000 already in use
# - Invalid Bearer Token
```

### Pull the Latest Version
```bash
# Force pull the latest image
docker pull ghcr.io/pashol/esctwat:latest

# Remove old containers
docker rm -f esctwat

# Start fresh
docker run -d -p 3000:3000 -p 5000:5000 -e TWITTER_BEARER_TOKEN=your_token --name esctwat ghcr.io/pashol/esctwat:latest
```

---

## Image Details

- **Registry:** GitHub Container Registry (ghcr.io)
- **Repository:** pashol/esctwat
- **Base Image:** node:18-alpine
- **Architecture:** Multi-stage build (optimized for size)
- **Size:** ~200MB (compressed)

### Image Layers

1. **Frontend Builder:** Builds React app
2. **Backend Builder:** Installs production dependencies
3. **Production:** Minimal runtime with both frontend and backend

---

## Security Notes

- Never commit your `TWITTER_BEARER_TOKEN` to the repository
- Use GitHub Secrets for CI/CD: https://github.com/pashol/esctwat/settings/secrets/actions
- The image includes only production dependencies
- Health checks are enabled for monitoring

---

## Additional Resources

- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Documentation](https://docs.docker.com/)
- [Project README](./README.md)
