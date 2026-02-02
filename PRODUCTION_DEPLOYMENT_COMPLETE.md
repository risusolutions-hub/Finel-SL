# ✅ PRODUCTION DEPLOYMENT - COMPLETE GUIDE

**Status**: ✅ Production Ready  
**Last Updated**: February 2, 2026  
**Tested**: Yes

---

## 🎯 What Was Done

### Backend Improvements
✅ Enhanced error handling with graceful shutdown  
✅ Added signal handlers (SIGTERM, SIGINT)  
✅ Improved logging and error messages  
✅ Added health check endpoints  
✅ Added diagnostic endpoints  
✅ Fixed port conflict detection  
✅ Added proper error recovery  

### Deployment Configuration
✅ Created PM2 ecosystem configuration  
✅ Created Docker support files  
✅ Created Nginx configuration template  
✅ Added production .env template  
✅ Created startup scripts (Bash & Batch)  
✅ Comprehensive deployment documentation  

---

## 📋 Files Created/Updated

### Configuration Files
- **ecosystem.config.js** - PM2 configuration for clustering
- **.env.production.template** - Production environment template
- **Dockerfile** - Docker container setup
- **docker-compose.yml** - Multi-container setup

### Documentation
- **DEPLOYMENT_PRODUCTION.md** - Complete deployment guide
- **startup.sh** - Linux/Mac startup script
- **startup.bat** - Windows startup script

### Source Code Updates
- **backend/server.js** - Enhanced with error handling & monitoring

---

## 🚀 Quick Start - 3 Options

### Option 1: PM2 (Recommended for Linux/Mac)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs sparkel-backend

# Monitor
pm2 monit
```

### Option 2: Docker (Cross-platform)
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

### Option 3: Direct (Simple)
```bash
cd backend
npm install --production
npm start
```

---

## ⚡ Pre-Deployment Setup (5 Minutes)

### Step 1: Create .env file
```bash
cp .env.production.template .env
nano .env  # Edit with your values
```

### Step 2: Generate Secrets
```bash
# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Update Key Variables
```
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=<generated_value>
JWT_SECRET=<generated_value>
CORS_ORIGIN=https://yourdomain.com
```

### Step 4: Test Locally
```bash
npm run dev
# or
npm start
```

### Step 5: Verify
```bash
curl http://localhost:4000/health
# Should return: {"ok":true,"timestamp":"...","uptime":...}
```

---

## 🔍 Available Endpoints

### Health & Monitoring
- **GET /health** - Basic health check
- **GET /ready** - Kubernetes readiness check
- **GET /api/system/diagnostics** - Full diagnostics

### API Routes
- **POST /api/auth/login** - User login
- **GET /api/auth/me** - Current user
- **GET /api/complaints** - List complaints
- **POST /api/complaints** - Create complaint
- **GET /api/users** - List users (admin)
- **GET /api/customers** - List customers
- **GET /api/machines** - List machines

---

## 🔐 Environment Variables

### Required (MUST SET)
```
NODE_ENV=production
MONGO_URI=mongodb://...
SESSION_SECRET=strong-random-value
JWT_SECRET=strong-random-value
```

### Important
```
CORS_ORIGIN=https://yourdomain.com
SMTP_HOST=your-mail-server
SMTP_USER=your-email
SMTP_PASS=your-password
```

### Optional
```
PORT=4000 (default)
ALLOW_PUBLIC_COMPLAINTS=true
ENABLE_REQUEST_LOGS=false
MAX_FILE_SIZE=104857600
```

---

## 📊 Monitoring

### PM2 Dashboard
```bash
pm2 web
# Visit http://localhost:9615
```

### PM2 Logs
```bash
# Real-time logs
pm2 logs sparkel-backend

# Error logs only
pm2 logs sparkel-backend --err

# Combined with timestamp
pm2 logs sparkel-backend --lines 100
```

### Docker Logs
```bash
docker-compose logs -f backend
```

### Manual Testing
```bash
# Health check
curl http://localhost:4000/health

# Diagnostics
curl http://localhost:4000/api/system/diagnostics

# Create complaint
curl -X POST http://localhost:4000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{"problem":"Test","isNewCustomer":true,...}'
```

---

## 🆘 Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :4000

# Check logs
pm2 logs sparkel-backend --err

# Check .env
cat .env | grep -v "^#"

# Kill old process
killall node
```

### Database connection error
```bash
# Test MongoDB
mongo mongodb://localhost:27017/sparkel

# Check connection string
echo $MONGO_URI

# Verify MongoDB is running
ps aux | grep mongod
```

### Memory issues
```bash
# Monitor memory
pm2 monit

# Set memory limit
pm2 set max_memory_restart 1G

# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### CORS errors
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

# Restart
pm2 restart sparkel-backend
```

---

## ✅ Production Checklist

Before deployment, verify:
- [ ] .env file created and configured
- [ ] All secrets generated (SESSION_SECRET, JWT_SECRET)
- [ ] Database connection works
- [ ] Health endpoint responds
- [ ] Backend starts without errors
- [ ] Logs are being written
- [ ] CORS is configured
- [ ] HTTPS/SSL is ready
- [ ] Firewall rules are set
- [ ] Monitoring is enabled

---

## 📈 Performance Tips

### 1. Enable Clustering
PM2 automatically uses all CPU cores with `exec_mode: 'cluster'`

### 2. Memory Management
```bash
pm2 set max_memory_restart 1G
```

### 3. Log Rotation
```bash
pm2 install pm2-logrotate
```

### 4. Database Optimization
- Create proper indexes
- Enable connection pooling
- Monitor slow queries

### 5. Caching
- Use Redis for sessions
- Cache API responses
- CDN for static files

---

## 🔄 Deployment Steps

### Linux/Mac with PM2
```bash
# 1. SSH to server
ssh user@server

# 2. Clone repo / Upload files
cd /var/www/sparkel

# 3. Install dependencies
npm install --production

# 4. Create .env
cp .env.production.template .env
# Edit .env with your values

# 5. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save

# 6. Setup auto-restart
pm2 startup
pm2 save
```

### Docker
```bash
# 1. Build
docker build -t sparkel-backend ./backend

# 2. Run
docker run -d \
  -p 4000:4000 \
  --env-file .env \
  --name sparkel-backend \
  sparkel-backend

# 3. Check
docker logs sparkel-backend
```

### Windows
```bash
# 1. Download files
# 2. Extract to C:\sparkel

# 3. Install
cd C:\sparkel\backend
npm install --production

# 4. Create .env
copy .env.production.template .env
# Edit .env

# 5. Run startup script
cd C:\sparkel
startup.bat
```

---

## 🎉 Success Indicators

Your deployment is successful when:
- ✅ `/health` returns status 200
- ✅ `/api/auth/login` endpoint responds
- ✅ Logs show "Server listening on 4000"
- ✅ No error messages in logs
- ✅ Database queries work
- ✅ CORS allows frontend domain
- ✅ PM2 shows process as "online"

---

## 📞 Support Resources

- **Logs**: `pm2 logs sparkel-backend`
- **Status**: `pm2 status`
- **Health**: `curl /health`
- **Diagnostics**: `curl /api/system/diagnostics`
- **PM2 Docs**: https://pm2.keymetrics.io/
- **Docker Docs**: https://docs.docker.com/

---

## 🔒 Security Reminders

1. **Never commit .env** - Use .gitignore
2. **Use strong secrets** - Min 32 characters
3. **Enable HTTPS** - Use SSL certificates
4. **Keep Node updated** - Security patches
5. **Monitor logs** - Watch for errors
6. **Backup database** - Regular backups
7. **Restrict CORS** - Only necessary domains
8. **Use firewall** - Limit port access

---

## 🚀 Next Steps

1. **Immediate**: Create .env file
2. **Test**: Run locally and verify endpoints
3. **Deploy**: Choose PM2, Docker, or direct
4. **Monitor**: Set up logging and alerts
5. **Optimize**: Monitor performance and tune
6. **Maintain**: Regular updates and backups

---

## 📋 Deployment Checklist Template

```
Date: __________
Deployed By: __________
Environment: Production
Server: __________

Pre-Deployment:
☐ .env file created
☐ Secrets generated
☐ Database verified
☐ Backend tested locally

Deployment:
☐ Files uploaded
☐ Dependencies installed
☐ Environment variables set
☐ Application started
☐ Health check passed

Post-Deployment:
☐ API endpoints tested
☐ Database connection verified
☐ Logs reviewed
☐ Monitoring enabled
☐ Team notified

Sign-off:
Deployer: __________
Reviewed By: __________
Approved: __________
```

---

**Status**: ✅ PRODUCTION READY  
**Issue Resolution**: ✅ COMPLETE  
**Deployment Support**: ✅ FULL  

Your application is ready for production deployment! 🚀
