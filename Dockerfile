# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG NPM_REGISTRY=https://mirror-npm.runflare.com
ARG NODE_OPTIONS="--max-old-space-size=4096"
ARG NEXT_PUBLIC_API_URL=https://api.peyvand-yar.ir/api
ARG NEXT_PUBLIC_APP_URL=https://api.peyvand-yar.ir
ARG GIT_SHA=unknown

ENV NODE_OPTIONS=${NODE_OPTIONS}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV GIT_SHA=${GIT_SHA}

# Copy package files
COPY package*.json ./
RUN npm config set registry ${NPM_REGISTRY} \
 && npm config set strict-ssl false \
 && npm ci --legacy-peer-deps

# Copy source code
COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
