# ============================================
# Base Stage - Common dependencies
# ============================================
FROM node:18-alpine AS base

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ============================================
# Development Stage
# ============================================
FROM base AS development

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development
ENV PORT=3000

# Use nodemon for hot-reloading (install globally for convenience)
RUN npm install -g nodemon

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/config', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run with nodemon for auto-reload
CMD ["dumb-init", "nodemon", "--watch", "server.js", "--watch", "public", "server.js"]

# ============================================
# Production Dependencies Stage
# ============================================
FROM base AS prod-deps

# Install only production dependencies
RUN npm install --production --frozen-lockfile

# ============================================
# Production Stage
# ============================================
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port 3000
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/config', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with dumb-init
CMD ["dumb-init", "node", "server.js"]
