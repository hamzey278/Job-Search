FROM node:20-alpine

# Set execution environment
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Copy dependency configs
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Ensure the logs directory is owned by the node user
RUN mkdir -p logs && chown -R node:node /usr/src/app

# Run as non-root user for security hardening
USER node

EXPOSE 5000

CMD ["node", "index.js"]
