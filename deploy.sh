#!/bin/bash
set -e

echo "=========================================="
echo " Pathfinder AI - Production Deployment"
echo "=========================================="

# Check if Docker is installed
if command -v docker &> /dev/null; then
  echo "✔ Docker detected: $(docker --version)"
  
  # Ensure .env or .env.local exists
  if [ ! -f .env.local ] && [ ! -f .env ]; then
    echo "⚠ Warning: No .env.local or .env file found. Copying .env.production.example to .env..."
    cp .env.production.example .env
    echo "Please update .env with your live API keys before starting."
  fi

  echo "Building and starting containers via Docker Compose..."
  docker compose down --remove-orphans || true
  docker compose up -d --build

  echo "✔ Pathfinder AI is live at http://localhost:3000"
  docker compose ps

elif command -v node &> /dev/null; then
  echo "✔ Node.js detected: $(node --version)"
  echo "Building production Next.js bundle directly..."
  npm ci
  npm run build
  echo "Starting production server with PM2 or npm start..."
  if command -v pm2 &> /dev/null; then
    pm2 delete pathfinder-ai || true
    pm2 start npm --name "pathfinder-ai" -- start
    pm2 save
    echo "✔ Pathfinder AI running in background via PM2 on port 3000"
  else
    echo "Starting Next.js on port 3000..."
    npm run start
  fi
else
  echo "✖ Neither Docker nor Node.js found. Please install Docker or Node 18+ to deploy."
  exit 1
fi
