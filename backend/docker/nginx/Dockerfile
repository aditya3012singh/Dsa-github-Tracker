# Stage 1: Build the React frontend
FROM node:20-slim AS frontend-builder

WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy application source code and compile
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve the compiled frontend and proxy API requests
FROM nginx:alpine

# Copy built React files
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx config file
COPY backend/docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
