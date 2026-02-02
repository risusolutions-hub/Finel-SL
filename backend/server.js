require('dotenv').config();

// Global error handlers - MUST be first
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION:', reason && (reason.stack || reason.message || reason));
});

// Graceful shutdown for traditional servers (NOT for Vercel/Serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM received');
    if (global.server) {
      global.server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  process.on('SIGINT', () => {
    console.log('⚠️  SIGINT received');
    if (global.server) {
      global.server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const { connectMongo } = require('./src/config/mongo');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const IS_VERCEL = !!process.env.VERCEL;
const ENABLE_REQUEST_LOGS = String(process.env.ENABLE_REQUEST_LOGS || 'false').toLowerCase() === 'true';

// Simple console logging (no file writes for Vercel)
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  originalLog(`[${new Date().toISOString()}]`, msg);
};

console.error = function (...args) {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  originalError(`[${new Date().toISOString()}]`, msg);
};


app.use(cors({ origin: ['http://localhost:3000','http://sp.vruti.in','https://sparkel.vruti.in'], credentials: true }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ...existing code...

// Serve uploaded files statically (for viewing)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// rate limiter - basic global limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// sessions (Mongo-backed)
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/sparkel',
  collectionName: 'sessions',
  ttl: 24 * 60 * 60
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'lax'
  }
}));

// API logging middleware (before routes)
// app.use('/api', apiLogger);

// Maintenance mode check (allows superadmin to bypass)
// app.use('/api', maintenanceMode);

// routes
// Temporarily commented out undefined routes to prevent errors
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/leaves', leaveRoutes);
// app.use('/api/work-time', workTimeRoutes);
// app.use('/api/uploads', uploadRoutes);
// app.use('/api/skills', skillRoutes);
// app.use('/api/service-history', serviceHistoryRoutes);
// app.use('/api/checklists', checklistRoutes);
// app.use('/api/duplicates', duplicateRoutes);
// app.use('/api/dashboard', dashboardRoutes);
// app.use('/api/settings', settingsRoutes);
// app.use('/api/system', systemRoutes);

// Health check endpoint
app.get('/health', (req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: process.env.NODE_ENV,
  port: PORT
}));

// Ready check endpoint (for Kubernetes/Docker)
app.get('/ready', (req, res) => res.json({ 
  ready: true, 
  timestamp: new Date().toISOString(),
  mongodb: 'connected'
}));

// Diagnostics endpoint
app.get('/api/system/diagnostics', (req, res) => res.json({
  memory: process.memoryUsage(),
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
  port: PORT,
  node_version: process.version
}));

async function start(){
  try{
    console.log('Connecting to MongoDB for sessions...');
    await connectMongo();
    console.log('Session store ready');


    // Require model files after connection (for mongoose registration)

    require('./src/models_mongo/User');
    require('./src/models_mongo/DailyWorkTime');
    const Settings = require('./src/models_mongo/Settings');
    require('./src/models_mongo/Customer');
    require('./src/models_mongo/Complaint');
    require('./src/models_mongo/Machine');
    require('./src/models_mongo/ApiLog');
    require('./src/models_mongo/Session');

    // Initialize default settings if missing
    if (Settings && typeof Settings.initializeDefaults === 'function') {
      await Settings.initializeDefaults();
    }

    const authRoutes = require('./src/routes/auth');
    const userRoutes = require('./src/routes/users');
    const customerRoutes = require('./src/routes/customers');
    const machineRoutes = require('./src/routes/machines');
    const complaintRoutes = require('./src/routes/complaints');
    const leaveRoutes = require('./src/routes/leaves');
    const workTimeRoutes = require('./src/routes/workTime');
    const skillRoutes = require('./src/routes/skills');
    const serviceHistoryRoutes = require('./src/routes/serviceHistory');
    const checklistRoutes = require('./src/routes/checklists');
    const duplicateRoutes = require('./src/routes/duplicates');
    const dashboardRoutes = require('./src/routes/dashboard');
    const settingsRoutes = require('./src/routes/settings');
    const systemRoutes = require('./src/routes/system');
    const apiLogger = require('./src/middleware/apiLogger');
    const maintenanceMode = require('./src/middleware/maintenanceMode');

    // API logging middleware (before routes)
    if (ENABLE_REQUEST_LOGS) {
      app.use(apiLogger);
    }

    // Maintenance mode middleware
    app.use(maintenanceMode);

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/machines', machineRoutes);
    app.use('/api/complaints', complaintRoutes);
    app.use('/api/leaves', leaveRoutes);
    app.use('/api/worktime', workTimeRoutes);
    app.use('/api/skills', skillRoutes);
    app.use('/api/service-history', serviceHistoryRoutes);
    app.use('/api/checklists', checklistRoutes);
    app.use('/api/duplicates', duplicateRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/system', systemRoutes);

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Route not found', path: req.path });
    });

    // Global error handler
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Start server with proper error handling
    global.server = app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🕐 Started at: ${new Date().toISOString()}`);
    });

    // Handle server errors
    global.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
        process.exit(1);
      }
    });

    // Handle server timeout
    global.server.setTimeout(300000); // 5 minutes

  } catch(err) {
    console.error('❌ Failed to start:', err && (err.stack || err.message || err));
    console.error('Stack:', err?.stack);
    process.exit(1);
  }
}

start();

// Export app for Vercel/serverless environments
module.exports = app;

// Only start listening on non-Vercel environments
// (Vercel will call the exported app function)
