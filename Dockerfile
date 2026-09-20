# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ARG VITE_APP_NAME
ARG VITE_APP_DESCRIPTION
ARG VITE_DISCLAIMER
ARG VITE_METRICS_API_KEY
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_DESCRIPTION=$VITE_APP_DESCRIPTION
ENV VITE_DISCLAIMER=$VITE_DISCLAIMER
ENV VITE_METRICS_API_KEY=$VITE_METRICS_API_KEY
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY server.js .

EXPOSE 8080
CMD ["node", "server.js"]
