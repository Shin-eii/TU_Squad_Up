# syntax=docker/dockerfile:1

FROM node:22-alpine AS api
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY app.js server.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY routes ./routes
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--config", "vite.docker.config.js"]
