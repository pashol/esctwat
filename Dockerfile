# Multi-stage build for Euro Twitter Monitor

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./

# Install dependencies (using npm install instead of ci due to transitive deps)
RUN npm install

# Copy frontend source
COPY client/ .

# Build React app
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Stage 3: Production image
FROM node:18-alpine

# Add OCI labels for GitHub Container Registry linking
LABEL org.opencontainers.image.source=https://github.com/pashol/esctwat
LABEL org.opencontainers.image.description="Eurovision Twitter Monitor - Real-time Twitter monitoring for Eurovision-related tweets"
LABEL org.opencontainers.image.licenses=MIT

# Set working directory
WORKDIR /app

# Install serve to run frontend
RUN npm install -g serve

# Copy built frontend from builder stage
COPY --from=frontend-builder /app/client/build ./client/build

# Copy server and its node_modules
COPY --from=backend-builder /app/server/node_modules ./server/node_modules
COPY server/ ./server/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/stream/status', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start both frontend and backend
CMD sh -c "cd ./server && npm start & serve -s ./client/build -l 3000"
