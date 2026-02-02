# ✅ Vercel Deployment Checklist

## Pre-Deployment Setup

- [ ] Created `backend/api/index.js` serverless handler
- [ ] Updated `vercel.json` with correct configuration
- [ ] `server.js` uses console-only logging (no file writes)
- [ ] `upload.js` configured for memory storage on Vercel
- [ ] `.env.production.template` created with all required variables
- [ ] MongoDB connection string ready
- [ ] Session secret generated (min 32 characters)
- [ ] JWT secret generated
- [ ] Frontend domain ready for CORS

---

## Environment Variables Setup

### In Vercel Dashboard (Settings > Environment Variables)

- [ ] `MONGO_URI` = `mongodb+srv://...`
- [ ] `SESSION_SECRET` = generated secret
- [ ] `JWT_SECRET` = generated secret
- [ ] `CORS_ORIGIN` = `https://yourdomain.com`
- [ ] `NODE_ENV` = `production`
- [ ] `MAX_FILE_SIZE` = `104857600`
- [ ] `VERCEL` = `true`

---

## MongoDB Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user credentials configured
- [ ] IP whitelist includes Vercel IPs (or 0.0.0.0/0 for testing)
- [ ] Connection string format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
- [ ] Test connection locally before deploying

---

## Repository Configuration

- [ ] `.gitignore` configured (excludes node_modules, .env, uploads)
- [ ] No .env files committed (only .env.template)
- [ ] `package.json` has all dependencies installed
- [ ] No local files committed that shouldn't be

```bash
# Verify before pushing
git status
git check-ignore node_modules .env backend/uploads
```

---

## Vercel Project Setup

- [ ] Project linked with `vercel link`
- [ ] Build settings: Default
- [ ] Install command: `npm install` (in backend directory)
- [ ] Build command: `npm run build` (if needed)
- [ ] Output directory: `.` (root, not backend)

---

## Deployment

- [ ] Run `vercel --prod` from project root
- [ ] Monitor build logs in Vercel dashboard
- [ ] Check Function Logs after deployment
- [ ] Test health endpoint: `curl https://your-url/health`
- [ ] Test ready endpoint: `curl https://your-url/ready`

---

## Post-Deployment Testing

### Health Checks
```bash
# Health check should return:
{
  "ok": true,
  "platform": "vercel",
  "uptime": X
}
```

- [ ] Health endpoint responds (200)
- [ ] Ready endpoint responds (200)
- [ ] System diagnostics endpoint responds

### API Testing
- [ ] POST /api/auth/login works
- [ ] GET /api/users returns data
- [ ] POST /api/complaints creates complaint
- [ ] GET /api/customers lists customers
- [ ] File upload accepts files in memory

### Database Connection
- [ ] MongoDB connection established
- [ ] Sessions stored in MongoDB
- [ ] Data persists across requests

---

## Monitoring

### Vercel Dashboard
- [ ] Function Logs show no errors
- [ ] Status: Active and running
- [ ] Memory usage: < 500MB
- [ ] Cold start time: < 5s
- [ ] Response times: < 1s (after cold start)

### Error Logs to Check
```
❌ "EROFS: read-only file system"     → File logging issue (FIXED)
❌ "ENOENT: no such file or directory" → Directory creation issue (FIXED)
❌ "No exports found in module"        → Missing handler export (FIXED)
✅ Should see timestamps with console logs
✅ Should see MongoDB connection messages
```

---

## Scaling & Optimization

### If experiencing issues:

**Slow cold starts (> 5s)**
- [ ] Check MongoDB connection time
- [ ] Optimize model loading
- [ ] Consider Keep-Alive configuration

**High memory usage (> 800MB)**
- [ ] Reduce MAX_FILE_SIZE
- [ ] Check for memory leaks in routes
- [ ] Monitor active connections

**Database timeouts**
- [ ] Increase maxDuration in vercel.json (up to 60s)
- [ ] Check MongoDB connection pool
- [ ] Verify network connectivity

**File upload failing**
- [ ] Verify multer memory storage configured
- [ ] Check MAX_FILE_SIZE limit
- [ ] Test with smaller file first

---

## Rollback Plan

If deployment fails:

```bash
# Check what was deployed
vercel --list

# Rollback to previous version
vercel rollback

# Or redeploy specific commit
vercel --prod --build-env RESET_CACHE=true
```

---

## Performance Baseline

Expected performance after deployment:

| Metric | Value |
|--------|-------|
| Cold Start | 2-3s |
| Warm Response | 100-200ms |
| Timeout Limit | 60s |
| Memory Limit | 1024MB |
| File Upload | Memory-based |
| Logging | Console to stdout |
| Database | MongoDB Atlas |

---

## Troubleshooting Matrix

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | App not responding | Check Function Logs |
| Connection timeout | MongoDB issue | Verify MONGO_URI, IP whitelist |
| File upload fails | Max size exceeded | Reduce MAX_FILE_SIZE |
| Logs not showing | Check wrong logs | Look in Function Logs tab |
| Cold start slow | First init | Warm up with health check |
| Session lost | Connection dropped | MongoDB should handle this |

---

## Final Verification

Before marking as complete:

- [ ] All environment variables set
- [ ] MongoDB accessible from Vercel
- [ ] Health check responds
- [ ] API endpoints respond
- [ ] Logs visible in Vercel dashboard
- [ ] No errors in Function Logs
- [ ] Application stable for 5+ minutes
- [ ] Ready for production traffic

---

## Deployed! 🎉

Document your deployment details:

```
Project: sparkel-leaser
Environment: Production
Platform: Vercel
Region: iad1 (US East)
URL: https://sparkel-leaser.vercel.app
Deploy Time: YYYY-MM-DD HH:MM:SS
Status: ✅ ACTIVE
```

---

**Everything is ready for Vercel serverless deployment!**
