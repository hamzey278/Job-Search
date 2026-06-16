# --- Stage 1: Build compilation ---
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Compile optimized static output
RUN npm run build

# --- Stage 2: Web Server serving ---
FROM nginx:1.25-alpine

# Copy compiled files to web root
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Replace default nginx config with our custom SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
