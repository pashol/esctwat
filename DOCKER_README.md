# Docker Setup for Eurovision Twitter Monitor

This project is containerized for easy deployment. Both frontend and backend run in a single Docker container.

## Prerequisites

- Docker and Docker Compose installed
- X.com API Bearer Token (set in environment)

## Quick Start

### 1. Build the Docker Image

```bash
docker-compose build
```

### 2. Run with Docker Compose

```bash
TWITTER_BEARER_TOKEN=your_bearer_token_here docker-compose up
```

Or on Windows PowerShell:
```powershell
$env:TWITTER_BEARER_TOKEN="your_bearer_token_here"
docker-compose up
```

Or on Windows CMD:
```cmd
set TWITTER_BEARER_TOKEN=your_bearer_token_here
docker-compose up
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Docker Commands

### View Logs
```bash
docker-compose logs -f
```

### Stop the Container
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

### Rebuild Image
```bash
docker-compose build --no-cache
```

### Run Commands Inside Container
```bash
docker-compose exec app sh
```

## Environment Variables

You can set environment variables in several ways:

### Option 1: Command Line (Recommended for Security)
```bash
TWITTER_BEARER_TOKEN=your_token LOG_LEVEL=info docker-compose up
```

### Option 2: Create .env File
Create a `.env` file in the project root:
```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
```

Then run:
```bash
docker-compose up
```

### Option 3: In docker-compose.yml
Edit the `environment` section in `docker-compose.yml` directly.

### Logging Verbosity
`LOG_LEVEL` controls backend logging verbosity. Supported values: `error`, `warn`, `info` (default), `debug`.

## Image Details

- **Base Image**: node:18-alpine (lightweight ~160MB)
- **Multi-stage Build**: Optimizes final image size by removing build dependencies
- **Frontend**: Built React app served with `serve`
- **Backend**: Express.js API on port 5000
- **Size**: ~350-400MB final image

## Architecture

### Build Stages:
1. **Frontend Builder**: Builds React app to static files
2. **Backend Builder**: Installs production dependencies only
3. **Production**: Combines both built artifacts

### Runtime:
- Node.js 18 Alpine Linux (minimal, fast)
- Express backend on port 5000
- Static frontend served on port 3000
- Health checks enabled

## Troubleshooting

### Port Already in Use
If ports 3000 or 5000 are already in use, you can map to different ports:

Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Map to 3001 instead
  - "5001:5000"  # Map to 5001 instead
```

### Container Won't Start
1. Check logs: `docker-compose logs`
2. Verify TWITTER_BEARER_TOKEN is set
3. Ensure Docker daemon is running
4. Try rebuilding: `docker-compose build --no-cache`

### No Tweets Appearing
Check that:
1. TWITTER_BEARER_TOKEN is valid and set
2. Backend is running: Check http://localhost:5000/api/stream/status
3. Logs show no errors: `docker-compose logs -f app`

## Production Deployment

### AWS ECR
```bash
# Tag image
docker tag esctwat-app:latest your-registry/esctwat-app:latest

# Push to ECR
docker push your-registry/esctwat-app:latest
```

### Docker Hub
```bash
# Login
docker login

# Tag and push
docker tag esctwat-app:latest yourusername/esctwat-app:latest
docker push yourusername/esctwat-app:latest
```

### Kubernetes
Deploy using the Docker image with your bearer token in a secret:
```bash
kubectl create secret generic twitter-token --from-literal=TWITTER_BEARER_TOKEN=your_token
```

## Development with Docker

For development with hot-reload, use the original setup instead:
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm start
```

## Security Notes

- **Never commit** `.env` files with real tokens
- Use **environment variables** or secrets management for production
- Keep Docker images updated: `docker pull node:18-alpine`
- Use a `.dockerignore` to exclude sensitive files

## Performance Tips

1. **Caching**: Docker layers are cached; put frequently changing files last
2. **Size**: Alpine images are much smaller than full Node images
3. **Multi-stage**: Reduces final image size by ~60%
4. **Health checks**: Enable automatic container restart on failure

---

For more info, see the main [README.md](./README.md)
