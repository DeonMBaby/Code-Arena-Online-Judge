FROM node:20-slim

# Install Docker CLI for sandbox execution
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5000
CMD ["node", "server.js"]
