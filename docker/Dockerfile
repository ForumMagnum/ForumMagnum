# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

# Needed for native modules during yarn install (node-gyp, bcrypt fallback)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Make sure yarn classic is available (safe even if already present)
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

# Copy the whole repo so postinstall scripts exist
COPY . .

RUN yarn install --frozen-lockfile
RUN ./node_modules/.bin/next build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY --from=build /app ./
CMD ["yarn", "next-start", "-p", "3000"]

