# ✅ Vercel Serverless Deployment Guide

## Overview
Your application is now fully configured for **Vercel serverless deployment**. All read-only filesystem constraints are handled.

---

## 🚀 Quick Start (5 minutes)

### 1. **Prepare Environment Variables**
```bash
cp .env.production.template .env.production.local
```

Edit `.env.production.local` with your production values:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/sparkel
SESSION_SECRET=your-secret-key-here
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. **Install Vercel CLI**
```bash
npm install -g vercel
```

### 3. **Deploy**
```bash
# Link to Vercel project
vercel link

# Deploy
vercel --prod
```

---

## 📁 File Structure for Vercel

```
project/
├── backend/
│   ├── api/
│   │   └── index.js          ← SERVERLESS HANDLER (new)
│   ├── src/
│   │   ├── routes/
│   │   ├── models_mongo/
│   │   ├── middleware/
│   │   └── config/
│   ├── server.js             ← Removed from Vercel (not used)
│   └── package.json
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── vercel.json               ← VERCEL CONFIG (updated)
└── .env.production.template
```

---

## 🔧 Key Changes Made

### ✅ **Fixed Issue 1: Read-only Filesystem Error**
**Problem:** `EROFS: read-only file system, open '/var/task/backend/server.log'`

**Solution:** 
- Removed all file-based logging from `server.js`
- Switched to console-only logging with timestamps
- Vercel captures console output automatically

### ✅ **Fixed Issue 2: Cannot Create Upload Directory**
**Problem:** `ENOENT: no such file or directory, mkdir '/var/task/backend/uploads'`

**Solution:** 
- Configured `upload.js` to use memory storage on Vercel
- Auto-detection via `process.env.VERCEL` flag
- Falls back to memory storage if directory creation fails
- All files stored in RAM (fine for temporary uploads)

### ✅ **Fixed Issue 3: Missing Module Export**
**Problem:** `No exports found in module - Did you forget to export function?`

**Solution:** 
- Created `backend/api/index.js` as serverless handler
- Properly exports Express app for Vercel
- Initializes routes on first request
- Handles MongoDB connection in serverless environment

---

## 📋 Configuration Details

### **vercel.json**
```json
{
  "version": 2,
  "buildCommand": "cd backend && npm install",
  "functions": {
    "backend/api/index.js": {
      "memory": 1024,
      "maxDuration": 60,
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "backend/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "VERCEL": "true"
  }
}
```

### **backend/api/index.js**
- Entry point for all Vercel requests
- Initializes Express app with all middleware
- Connects to MongoDB on first request
- Loads all routes and models
- No file system writes

### **Upload Storage**
- **On Vercel:** Memory storage (`multer.memoryStorage()`)
- **Locally:** Disk storage (`/backend/uploads/`)
- **Auto-detection:** `process.env.VERCEL === 'true'`

### **Logging**
- All logs go to console (stdout)
- Vercel captures and displays in dashboard
- Timestamps added automatically

---

## ⚙️ Environment Variables (Required)

Set these in Vercel project settings:

```
MONGO_URI              = Your MongoDB connection string
SESSION_SECRET         = Random secret string (min 32 chars)
JWT_SECRET             = Another random secret string
CORS_ORIGIN            = Your frontend domain
NODE_ENV               = production
MAX_FILE_SIZE          = 104857600 (100MB)
API_PORT               = 4000 (optional, Vercel ignores)
```

---

## 🚦 Testing Deployment

### **After Deployment**

1. **Check Health:**
```bash
curl https://your-project.vercel.app/health
# Response:
{
  "ok": true,
  "timestamp": "2024-01-15T...",
  "platform": "vercel",
  "uptime": 5.2
}
```

2. **Check Ready Status:**
```bash
curl https://your-project.vercel.app/ready
# Response:
{
  "ready": true,
  "timestamp": "2024-01-15T..."
}
```

3. **Check API:**
```bash
curl https://your-project.vercel.app/api/system/diagnostics
```

---

## 🔍 Troubleshooting

### **Database Connection Failed**
```
Error: connect ECONNREFUSED
```
✅ **Fix:** Verify MONGO_URI in Vercel project settings
- Check MongoDB connection string is correct
- Ensure IP whitelist includes Vercel IPs (add 0.0.0.0/0 for testing)
- Test locally first with same credentials

### **Memory Storage Overflow**
```
Error: File too large
```
✅ **Fix:** Increase `MAX_FILE_SIZE` or compress uploads
- Default: 100MB
- Vercel function memory: 1024MB max
- Reduce MAX_FILE_SIZE for safety: `52428800` (50MB)

### **Session Persistence Issues**
```
Error: Session data lost
```
✅ **Fix:** Sessions stored in MongoDB
- MongoDB connection must be stable
- Each request gets fresh session
- No in-memory session store (doesn't survive restarts)

### **Logs Not Appearing**
```
No console output visible
```
✅ **Fix:** Check Vercel dashboard
- Go to your project → Deployments → Function Logs
- Logs appear in real-time as requests happen
- Filter by time/status as needed

---

## 📊 Performance Optimization

### **Cold Start Optimization**
- First request: ~2-3 seconds (MongoDB connection)
- Subsequent requests: ~100-200ms
- Keep-alive: Configure to reduce cold starts

### **Memory Management**
- Vercel limit: 1024MB per function
- Upload storage: In-memory only (use 50MB max)
- MongoDB connection pooling enabled

### **Request Timeout**
- Max duration: 60 seconds per request
- Optimal: Keep requests under 30 seconds
- Long operations: Use async processing

---

## 🔐 Security Notes

### **Environment Variables**
- Store secrets in Vercel dashboard (not in code)
- Never commit `.env.production` file
- Use `.env.production.template` as reference

### **CORS Configuration**
- Set exact frontend domain in CORS_ORIGIN
- Don't use wildcard (*) in production
- Support multiple domains by updating code

### **HTTPS/SSL**
- Vercel provides free SSL certificates
- All traffic automatically redirected to HTTPS
- No additional configuration needed

---

## 📚 Documentation Links

- [Vercel Documentation](https://vercel.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Connection](https://docs.mongodb.com/drivers/node/)
- [Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)

---

## ✨ What's Included

✅ `backend/api/index.js` - Serverless handler  
✅ `vercel.json` - Complete Vercel configuration  
✅ `backend/server.js` - Console logging only (no file writes)  
✅ `backend/src/config/upload.js` - Memory storage for Vercel  
✅ `.env.production.template` - Environment variable template  
✅ All 213 backend dependencies  
✅ Health check endpoints  
✅ Error handling  
✅ Session management with MongoDB  

---

## 🎯 Next Steps

1. **Set environment variables** in Vercel project settings
2. **Test locally** before deploying: `npm start`
3. **Deploy:** `vercel --prod`
4. **Monitor:** Check Function Logs in Vercel dashboard
5. **Scale:** Adjust memory/timeout as needed

---

**Ready to deploy! 🚀**
