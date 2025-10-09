# MeetingMind Platform - Revolutionary AI Meeting Intelligence
# Multi-stage Docker build for Railway deployment

# Stage 1: Frontend Build
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/web-app/package*.json ./
RUN npm ci --only=production

COPY frontend/web-app/ ./
RUN npm run build

# Stage 2: Backend Build
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./

# Stage 3: Production Runtime
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Create app directory
WORKDIR /app

# Copy backend application
COPY --from=backend-builder /app/backend ./backend
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/web-app/dist

# Copy additional platform files
COPY features/ ./features/
COPY database/ ./database/
COPY system/ ./system/
COPY testing/ ./testing/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S meetingmind -u 1001

# Set ownership
RUN chown -R meetingmind:nodejs /app
USER meetingmind

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "backend/server.js"]
