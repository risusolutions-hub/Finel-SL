@echo off
REM Production Deployment Script for Windows
REM Usage: deploy-production.bat

setlocal enabledelayedexpansion

echo.
echo 🚀 Production Deployment Script - Windows
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" if not exist "backend" (
  echo ❌ Error: Run this script from the project root directory
  exit /b 1
)

REM Step 1: Backend setup
echo.
echo 📦 Setting up backend...
cd backend

echo   Installing backend dependencies...
call npm install --production
if errorlevel 1 (
  echo ❌ Backend npm install failed
  exit /b 1
)

echo.
echo   ⚠️  IMPORTANT: Update .env file with:
echo      - NODE_ENV=production
echo      - Strong SESSION_SECRET and JWT_SECRET
echo      - Update CORS origin to production domain
echo.
set /p confirm="Have you updated backend/.env for production? (y/n): "
if /i not "%confirm%"=="y" (
  echo ❌ Please update backend/.env and try again
  exit /b 1
)

echo.
echo   ✓ Backend configuration verified

cd ..

REM Step 2: Frontend setup
echo.
echo 🎨 Building frontend...
cd frontend

echo   Installing frontend dependencies...
call npm install --production
if errorlevel 1 (
  echo ❌ Frontend npm install failed
  exit /b 1
)

echo.
echo   ⚠️  IMPORTANT: Update src/api.js with:
echo      - Production backend URL (not localhost:4000)
echo.
set /p confirm="Have you updated frontend/src/api.js? (y/n): "
if /i not "%confirm%"=="y" (
  echo ❌ Please update frontend/src/api.js and try again
  exit /b 1
)

echo.
echo   Building optimized production bundle...
call npm run build
if errorlevel 1 (
  echo ❌ Frontend build failed
  exit /b 1
)

if exist "build" (
  echo   ✓ Frontend build complete
  echo   📁 Production files ready in: frontend/build/
) else (
  echo ❌ Frontend build directory not found
  exit /b 1
)

cd ..

REM Step 3: Summary
echo.
echo ✅ Deployment Preparation Complete!
echo.
echo 📋 Next Steps:
echo   1. Deploy backend/: npm start (on your production server)
echo   2. Deploy frontend/build/: Serve via IIS, nginx, apache, or static host
echo   3. Ensure backend/.env is set with production variables
echo   4. Verify database connection on production server
echo   5. Configure HTTPS/SSL certificates
echo   6. Set up monitoring and logging
echo.
echo 🔐 Security Reminders:
echo   ✓ NODE_ENV set to 'production'?
echo   ✓ Strong SESSION_SECRET configured?
echo   ✓ Strong JWT_SECRET configured?
echo   ✓ CORS origin updated to production domain?
echo   ✓ API URL in frontend points to production backend?
echo.
pause
