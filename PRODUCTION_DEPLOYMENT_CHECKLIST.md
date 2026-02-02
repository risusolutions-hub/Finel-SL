# 📋 PRODUCTION DEPLOYMENT CHECKLIST

Use this checklist before deploying to production.

---

## 🔴 CRITICAL - Must Complete

### Backend Configuration
- [ ] Update `backend/.env` file:
  ```
  NODE_ENV=production
  ```
  
- [ ] Generate and set secure SESSION_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Paste result into `.env`:
  ```
  SESSION_SECRET=<generated-value>
  ```

- [ ] Generate and set secure JWT_SECRET:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Paste result into `.env`:
  ```
  JWT_SECRET=<generated-value>
  ```

- [ ] Update CORS origin in `backend/server.js` (line ~43):
  - Change from: `'http://localhost:3000'`
  - To: Your production domain (e.g., `'https://app.yourdomain.com'`)
  - OR use environment variable

- [ ] Verify database connection:
  - MySQL connection in `.env` is correct
  - Database exists and is accessible
  - Test: `npm run test:db` or check logs on startup

### Frontend Configuration
- [ ] Update `frontend/src/api.js`:
  - Find: `baseURL: 'http://localhost:4000/api'`
  - Change to: Production backend URL
  - Example: `baseURL: 'https://api.yourdomain.com/api'`

- [ ] Build frontend:
  ```bash
  cd frontend
  npm run build
  ```
  Verify: `/build` directory created successfully

- [ ] Test build locally:
  ```bash
  npm install -g serve
  serve -s build -l 3000
  ```
  Open browser: `http://localhost:3000`

### Backend Startup
- [ ] Install production dependencies:
  ```bash
  cd backend
  npm install --production
  ```

- [ ] Test backend startup:
  ```bash
  npm start
  ```
  Should see:
  - ✅ No module errors
  - ✅ Server listening on port 4000
  - ✅ MongoDB/Database connected
  
- [ ] Stop backend (Ctrl+C)

---

## 🟡 IMPORTANT - Should Complete

### Infrastructure
- [ ] SSL/HTTPS certificates installed
- [ ] Firewall rules configured
- [ ] Database backups configured
- [ ] Server monitoring set up
- [ ] Log rotation configured
- [ ] Rate limiting configured for production load

### Security
- [ ] Secrets not hardcoded (use environment variables)
- [ ] CORS whitelist only necessary domains
- [ ] CSRF protection enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Mongoose handles this)
- [ ] XSS protection enabled (Helmet should handle)
- [ ] Rate limiting appropriate for production

### Performance
- [ ] Database indexes optimized
- [ ] CDN configured for static assets
- [ ] Caching strategy implemented
- [ ] Compression enabled (gzip)
- [ ] Load balancing configured (if multiple servers)

### Monitoring & Logging
- [ ] Error logging configured
- [ ] Request logging configured
- [ ] Health check endpoint set up
- [ ] Uptime monitoring configured
- [ ] Alert thresholds set
- [ ] Log aggregation service set up

---

## 🟢 RECOMMENDED - Nice to Have

### Process Management
- [ ] PM2 or Forever installed for process management
- [ ] Auto-restart on crash configured
- [ ] Graceful shutdown implemented
- [ ] Zero-downtime deployment setup

### Testing
- [ ] End-to-end tests passing: `npm run test:e2e`
- [ ] Load testing performed
- [ ] Penetration testing completed
- [ ] Browser compatibility verified

### Documentation
- [ ] Deployment documentation updated
- [ ] Runbook created for common issues
- [ ] API documentation up to date
- [ ] Team trained on deployment process

### Optimization
- [ ] Frontend build optimized (source maps removed)
- [ ] Unused dependencies removed
- [ ] Environment-specific configs created
- [ ] Build artifacts cached appropriately

---

## 🔐 Security Quick Checks

```bash
# In backend directory:
npm audit

# Should show minimal vulnerabilities (most are dev-only)
# High severity items in tar/build tools are acceptable
# High severity in runtime code should be addressed
```

### Critical Security Files
- [ ] `.env` file is in `.gitignore` (never commit secrets)
- [ ] Session secret is cryptographically random
- [ ] JWT secret is cryptographically random
- [ ] CORS origin is restricted
- [ ] Helmet security headers enabled
- [ ] Rate limiting enabled
- [ ] No console.log statements exposing sensitive data

---

## ✅ Pre-Deployment Testing

### Backend Tests
```bash
cd backend

# Test database connection
npm run test:db

# Or manually:
npm start
# Check if it connects successfully
```

### Frontend Tests
```bash
cd frontend

# Build test
npm run build
# Should complete without errors

# Serve test
npm install -g serve
serve -s build -l 3000
# Visit http://localhost:3000 in browser
# Check Network tab - API calls should go to production backend
```

### Full Integration Test
1. Start backend: `cd backend && npm start`
2. Serve frontend: `cd frontend && serve -s build -l 3000`
3. Test key workflows:
   - [ ] Login/Authentication
   - [ ] Data loading
   - [ ] Create complaint
   - [ ] View complaints
   - [ ] User profile
   - [ ] Logout

---

## 🚀 Deployment Steps

### Step 1: Prepare Backend Server
```bash
# SSH into production server
ssh user@production-server

# Go to project directory
cd /path/to/project/backend

# Pull latest code (if using git)
git pull origin main

# Install production dependencies
npm install --production

# Verify .env file exists and is configured
cat .env
# Check: NODE_ENV=production, secrets set, DB connection correct

# Start with process manager
pm2 start server.js --name "sparkel-backend"
pm2 save

# Verify it's running
pm2 status
```

### Step 2: Deploy Frontend
```bash
# Build locally or on build server
cd frontend
npm run build

# Upload to web server
scp -r build/* user@webserver:/var/www/html/

# Alternatively, use your deployment tool (Vercel, Netlify, etc.)
```

### Step 3: Verify Deployment
- [ ] Backend API responds: `curl https://api.yourdomain.com/api/health`
- [ ] Frontend loads: `https://yourdomain.com`
- [ ] Console shows no errors
- [ ] API calls work
- [ ] Login works
- [ ] Create complaint works

---

## 🔄 Post-Deployment

### Monitor First Hour
- [ ] Check server CPU usage (should be normal)
- [ ] Check memory usage (should be stable)
- [ ] Check database query times
- [ ] Monitor error logs
- [ ] Check API response times

### Verify Key Metrics
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No error rate > 1%
- [ ] All critical features working
- [ ] No spike in CPU/Memory

### Communication
- [ ] Notify users of deployment
- [ ] Monitor support channels for issues
- [ ] Be ready to rollback if needed
- [ ] Document any issues encountered

---

## 🆘 Rollback Procedure

If deployment fails:

```bash
# Backend rollback
cd backend
git checkout main
npm install --production
pm2 restart sparkel-backend

# Frontend rollback
# Restore previous build from backup
scp -r backup/build/* user@webserver:/var/www/html/

# Verify
curl https://api.yourdomain.com/health
# Check https://yourdomain.com
```

---

## 📞 Support Contacts

- Database Administrator: [contact]
- Infrastructure Team: [contact]
- DevOps Lead: [contact]
- On-call Engineer: [contact]

---

## 📝 Deployment Log

Use this section to document your deployment:

**Date**: _______________  
**Deployed By**: _______________  
**Start Time**: _______________  
**Finish Time**: _______________  

### Issues Encountered
1. _______________
2. _______________
3. _______________

### Solutions Applied
1. _______________
2. _______________
3. _______________

### Verification Results
- Backend: ✅ / ❌ Status: _______________
- Frontend: ✅ / ❌ Status: _______________
- Integration: ✅ / ❌ Status: _______________

### Sign-off
- Deployer: _______________
- Reviewed By: _______________
- Approved: ✅ / ❌

---

**Last Updated**: February 2, 2026  
**Status**: Production Ready ✅  
**Module Error**: RESOLVED ✅
