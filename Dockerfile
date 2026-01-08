# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

COPY package.json package-lock.json ./
COPY web/package.json ./web/
RUN npm install

COPY . .
WORKDIR /app/web
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1. Copy Public Assets
COPY --from=builder /app/web/public ./public

# 2. FIXED: Copy from the root of 'standalone' to avoid path errors
COPY --from=builder /app/web/.next/standalone ./

# 3. Copy Static Assets
COPY --from=builder /app/web/.next/static ./.next/static

EXPOSE 3000

# 4. Dynamic CMD to find server.js
CMD ["sh", "-c", "node $(find . -name server.js | head -n 1)"]
