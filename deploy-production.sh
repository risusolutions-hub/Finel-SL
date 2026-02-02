#!/bin/bash
# Production Deployment Script
# Usage: ./deploy-production.sh

set -e

echo "🚀 Production Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
  echo "❌ Error: Run this script from the project root directory"
  exit 1
fi

# Step 1: Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

echo "  ✓ Installing backend dependencies..."
npm install --production

echo "  ⚠️  IMPORTANT: Update .env file with:"
echo "     - NODE_ENV=production"
echo "     - Strong SESSION_SECRET and JWT_SECRET"
echo "     - Update CORS origin to production domain"
echo ""
read -p "  Have you updated backend/.env for production? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Please update backend/.env and try again"
  exit 1
fi

# Verify backend starts
echo "  Testing backend startup..."
if timeout 3 npm start 2>&1 | grep -q "Cannot find module"; then
  echo "❌ Backend has module errors. Fix them first."
  exit 1
fi
echo "  ✓ Backend modules verified"

cd ..

# Step 2: Frontend setup
echo ""
echo "🎨 Building frontend..."
cd frontend

echo "  ✓ Installing frontend dependencies..."
npm install --production

echo "  ⚠️  IMPORTANT: Update src/api.js with:"
echo "     - Production backend URL (not localhost:4000)"
echo ""
read -p "  Have you updated frontend/src/api.js? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Please update frontend/src/api.js and try again"
  exit 1
fi

echo "  Building optimized production bundle..."
npm run build

if [ -d "build" ]; then
  echo "  ✓ Frontend build complete"
  echo "  📁 Production files ready in: frontend/build/"
else
  echo "❌ Frontend build failed"
  exit 1
fi

cd ..

# Step 3: Summary
echo ""
echo "✅ Deployment Preparation Complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Deploy backend/: npm start (on your production server)"
echo "  2. Deploy frontend/build/: Serve via nginx, apache, or static host"
echo "  3. Ensure backend/.env is set with production variables"
echo "  4. Verify database connection on production server"
echo "  5. Configure HTTPS/SSL certificates"
echo "  6. Set up monitoring and logging"
echo ""
echo "🔐 Security Reminders:"
echo "  ✓ NODE_ENV set to 'production'?"
echo "  ✓ Strong SESSION_SECRET configured?"
echo "  ✓ Strong JWT_SECRET configured?"
echo "  ✓ CORS origin updated to production domain?"
echo "  ✓ API URL in frontend points to production backend?"
echo ""
