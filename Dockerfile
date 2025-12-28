# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Set default environment variables
ENV PORT=3000

# Start the application
CMD ["npm", "start"]
