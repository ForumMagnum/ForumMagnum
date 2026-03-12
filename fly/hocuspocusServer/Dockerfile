# Build stage
FROM node:24-slim AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for building)
COPY package*.json ./
RUN yarn install --frozen-lockfile

# Copy source and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN yarn build

# Production stage
FROM node:24-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN yarn install --production --frozen-lockfile

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

CMD ["node", "dist/index.js"]
