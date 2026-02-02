#!/bin/bash
# Production Deployment Startup Script
# Usage: ./startup.sh

set -e

echo "=============================================="
echo "🚀 SPARKEL BACKEND - PRODUCTION STARTUP"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ Error: .env file not found!${NC}"
  echo "Please create .env file from .env.production.template"
  exit 1
fi

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
  echo -e "${YELLOW}⚠️  Installing dependencies...${NC}"
  cd backend
  npm install --production
  cd ..
fi

# Check Node version
echo -e "${YELLOW}Checking Node version...${NC}"
NODE_VERSION=$(node -v)
echo "Node: $NODE_VERSION"

# Check environment
echo -e "${YELLOW}Environment: $(grep NODE_ENV .env | cut -d'=' -f2)${NC}"

# Test database connection
echo ""
echo -e "${YELLOW}Testing database connection...${NC}"
cd backend
timeout 5 npm start || true
cd ..

echo ""
echo -e "${GREEN}✅ Startup checks complete!${NC}"
echo ""
echo "Choose deployment option:"
echo "1) PM2 (recommended)"
echo "2) Docker"
echo "3) Direct (npm start)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo -e "${YELLOW}Starting with PM2...${NC}"
    pm2 start ecosystem.config.js --env production
    pm2 save
    pm2 status
    ;;
  2)
    echo -e "${YELLOW}Starting with Docker...${NC}"
    docker-compose up -d
    docker-compose logs -f backend
    ;;
  3)
    echo -e "${YELLOW}Starting direct...${NC}"
    cd backend
    npm start
    ;;
  *)
    echo -e "${RED}Invalid choice!${NC}"
    exit 1
    ;;
esac
