# 🚀 PRODUCTION DEPLOYMENT GUIDE

**Last Updated**: February 2, 2026  
**Status**: Production Ready

---

## ⚠️ Pre-Deployment Checklist

### Critical Items (MUST DO)
- [ ] Create `.env` file in project root (never commit this!)
- [ ] Update all environment variables from `.env.production.template`
- [ ] Generate strong SESSION_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Generate strong JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Update CORS_ORIGIN to your production domain
- [ ] Verify MongoDB/MySQL connection works
- [ ] Test backend locally: `npm run dev` or `npm start`
- [ ] Build frontend: `npm run build` (from frontend directory)

### Security Checklist
- [ ] .env file is in .gitignore (never push secrets!)
- [ ] NODE_ENV=production is set
- [ ] HTTPS/SSL certificates are valid
- [ ] Firewall rules allow only necessary ports (80, 443, 4000)
- [ ] Database password is strong
- [ ] SSH keys are secured
- [ ] API rate limiting is configured
- [ ] CORS is restricted to your domains

---

## 📦 Option 1: Using PM2 (Recommended)

### Installation
```bash
npm install -g pm2
pm2 install pm2-logrotate
```

### Deploy with PM2
```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Check status
pm2 status

# View logs
pm2 logs sparkel-backend

# Restart
pm2 restart sparkel-backend

# Stop
pm2 stop sparkel-backend

# Delete
pm2 delete sparkel-backend

# Save startup configuration
pm2 startup
pm2 save
```

### Monitor with PM2
```bash
# Real-time monitoring
pm2 monit

# Show dashboard
pm2 web  # Visit http://localhost:9615

# Set alarms
pm2 set max_memory_restart 1G
```

---

## 🐳 Option 2: Using Docker

### Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy application code
COPY backend/ ./

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGO_URI=mongodb://mongo:27017/sparkel
    depends_on:
      - mongo
    restart: unless-stopped
    networks:
      - sparkel-network

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped
    networks:
      - sparkel-network

volumes:
  mongo-data:

networks:
  sparkel-network:
    driver: bridge
```

### Run with Docker Compose
```bash
docker-compose up -d
docker-compose logs -f backend
```

---

## 🌐 Option 3: Using Nginx + Node

### Nginx Configuration
```nginx
upstream backend {
  server localhost:4000;
}

server {
  listen 80;
  server_name api.yourdomain.com;
  
  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.yourdomain.com;

  # SSL certificates
  ssl_certificate /etc/ssl/certs/yourdomain.crt;
  ssl_certificate_key /etc/ssl/private/yourdomain.key;

  # SSL settings
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Compression
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;

  # Proxy settings
  proxy_read_timeout 300s;
  proxy_connect_timeout 75s;

  location / {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Enable Nginx Config
```bash
# Test configuration
sudo nginx -t

# Enable site
sudo ln -s /etc/nginx/sites-available/sparkel /etc/nginx/sites-enabled/

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🔄 Deployment Steps

### Step 1: Prepare Server
```bash
# SSH into production server
ssh user@production-server

# Create application directory
mkdir -p /var/www/sparkel
cd /var/www/sparkel

# Clone repository (or upload files)
git clone your-repo.git .
# OR
scp -r ./backend user@server:/var/www/sparkel/
```

### Step 2: Install Dependencies
```bash
cd /var/www/sparkel/backend
npm install --production
```

### Step 3: Configure Environment
```bash
# Copy and edit .env
cp .env.production.template .env
nano .env  # Edit with your production values

# Verify configuration
cat .env
```

### Step 4: Start Application
```bash
# Option A: With PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Option B: With Docker
docker-compose up -d

# Option C: Direct
npm start
```

### Step 5: Verify Deployment
```bash
# Check if running
curl http://localhost:4000/health

# Check logs
tail -f /var/log/sparkel/backend.log
# or
pm2 logs sparkel-backend
```

---

## 🔍 Troubleshooting

### Server Won't Start
```bash
# Check port availability
lsof -i :4000

# Check logs
pm2 logs sparkel-backend --err

# Check environment
cat .env | grep -v "^#"

# Check Node version
node --version

# Check npm modules
npm ls --depth=0
```

### Database Connection Error
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/sparkel

# Check connection string in .env
echo $MONGO_URI

# Verify MongoDB is running
ps aux | grep mongod
```

### Memory Issues
```bash
# Monitor memory
pm2 monit

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" pm2 start ecosystem.config.js

# Check PM2 configuration
pm2 show sparkel-backend
```

### Port Already in Use
```bash
# Find process using port 4000
lsof -i :4000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=5000
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
# Dashboard
pm2 web

# Logs
pm2 logs sparkel-backend

# Memory monitoring
pm2 set max_memory_restart 1G

# Status
pm2 status
```

### Health Checks
```bash
# Basic health
curl http://localhost:4000/health

# Ready check (Kubernetes)
curl http://localhost:4000/ready

# Diagnostics
curl http://localhost:4000/api/system/diagnostics
```

### Log Files
```bash
# PM2 logs
tail -f ~/.pm2/logs/sparkel-backend-out.log
tail -f ~/.pm2/logs/sparkel-backend-error.log

# Application logs
tail -f /var/www/sparkel/backend/logs/combined.log
```

---

## 🔐 Security Hardening

### After Deployment
1. Enable firewall
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. Set up SSL/TLS certificates
   ```bash
   sudo certbot certonly --standalone -d api.yourdomain.com
   ```

3. Enable automatic security updates
   ```bash
   sudo apt-get install unattended-upgrades
   ```

4. Configure log rotation
   ```bash
   sudo nano /etc/logrotate.d/sparkel
   ```

5. Set up monitoring alerts
   - Use PM2 Plus for alerts
   - Configure Nginx logs
   - Set up uptime monitoring

---

## 📈 Performance Optimization

### Node.js Optimization
```bash
# Use production mode
NODE_ENV=production

# Increase max file descriptors
ulimit -n 65535

# Use clustering
NODE_CLUSTER=true
```

### Database Optimization
- Create database indexes
- Enable connection pooling
- Monitor slow queries
- Regular backups

### Caching Strategy
- Use Redis for sessions (instead of MongoDB)
- Cache API responses
- Implement CDN for static files

---

## 🔄 Continuous Deployment

### GitHub Actions Example
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - uses: easingthemes/ssh-deploy@main
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_KEY }}
          REMOTE_HOST: ${{ secrets.HOST }}
          REMOTE_USER: ${{ secrets.USER }}
          TARGET: /var/www/sparkel
      - run: pm2 restart ecosystem.config.js --env production
```

---

## 📞 Support

### Common Issues
- Port already in use → Change PORT in .env
- Connection refused → Check MONGO_URI
- Memory issues → Increase max_old_space_size
- CORS errors → Update CORS_ORIGIN

### Getting Help
1. Check logs: `pm2 logs`
2. Check health: `curl /health`
3. Check diagnostics: `curl /api/system/diagnostics`
4. Review documentation
5. Contact support

---

## ✅ Deployment Checklist

Before going live, verify:
- [ ] Server is accessible
- [ ] Health check passes
- [ ] API endpoints respond
- [ ] Database connection works
- [ ] Logs are being written
- [ ] SSL/HTTPS works
- [ ] CORS is properly configured
- [ ] Rate limiting is active
- [ ] Monitoring is enabled
- [ ] Backups are configured
- [ ] Team is notified

---

**Status**: ✅ Production Ready  
**Environment**: Production  
**Last Checked**: February 2, 2026
