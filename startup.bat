@echo off
REM Production Deployment Startup Script for Windows
REM Usage: startup.bat

setlocal enabledelayedexpansion

echo.
echo ===============================================
echo  SPARKEL BACKEND - PRODUCTION STARTUP
echo ===============================================
echo.

REM Check if .env exists
if not exist ".env" (
  echo ERROR: .env file not found!
  echo Please create .env file from .env.production.template
  pause
  exit /b 1
)

REM Check if node_modules exists
if not exist "backend\node_modules" (
  echo Installing dependencies...
  cd backend
  call npm install --production
  cd ..
)

REM Check Node version
echo Checking Node version...
node -v

REM Check environment
for /f "tokens=2 delims==" %%i in ('findstr "NODE_ENV" .env') do (
  echo Environment: %%i
)

REM Test database connection
echo.
echo Testing database connection...
cd backend
timeout /t 5 /nobreak
npm start
cd ..

echo.
echo Startup checks complete!
echo.
echo Choose deployment option:
echo 1) PM2 (recommended)
echo 2) Docker
echo 3) Direct (npm start)
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
  echo Starting with PM2...
  pm2 start ecosystem.config.js --env production
  pm2 save
  pm2 status
  pause
) else if "%choice%"=="2" (
  echo Starting with Docker...
  docker-compose up -d
  docker-compose logs -f backend
  pause
) else if "%choice%"=="3" (
  echo Starting direct...
  cd backend
  npm start
  pause
) else (
  echo Invalid choice!
  pause
  exit /b 1
)
