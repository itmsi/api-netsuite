# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency records
COPY package*.json ./

# Install production dependencies only (using npm ci for predictability if package-lock exists)
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps

# Copy application source code
COPY . .

# ==========================================
# Stage 2: Production release (Lightweight)
# ==========================================
FROM node:22-alpine

# Use non-root user for security best practice
# Alpine's node image comes with 'node' user
USER node

WORKDIR /app

# Set environments
ENV NODE_ENV=production

# Copy from builder stage
COPY --chown=node:node --from=builder /app ./

# Create runtime directories if not exist, and give node ownership
RUN mkdir -p logs public storages

# Expose port (default 9581, configurable via docker-compose)
EXPOSE 9581

# Start the application using OpenTelemetry node --require 
# to initialize tracing hooks before express starts
CMD ["node", "--require", "./src/instrumentation.js", "src/server.js"]
