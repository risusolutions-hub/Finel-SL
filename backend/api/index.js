// Vercel Serverless Function Handler
// This file handles all API requests on Vercel

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const { connectMongo } = require('../src/config/mongo');
const rateLimit = require('express-rate-limit');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://sp.vruti.in',
    'https://sparkel.vruti.in',
    process.env.CORS_ORIGIN || ''
  ].filter(Boolean),
  credentials: true
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Sessions - using MongoDB
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
    secure: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: 'lax'
  }
}));

// Health check
app.get('/health', (req, res) => res.json({
  ok: true,
  timestamp: new Date().toISOString(),
  platform: 'vercel',
  uptime: process.uptime()
}));

app.get('/ready', (req, res) => res.json({
  ready: true,
  timestamp: new Date().toISOString()
}));

// Initialize routes
let initialized = false;

async function initializeRoutes() {
  if (initialized) return;
  initialized = true;

  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectMongo();
    console.log('✅ MongoDB connected');

    // Load models
    require('../src/models_mongo/User');
    require('../src/models_mongo/DailyWorkTime');
    const Settings = require('../src/models_mongo/Settings');
    require('../src/models_mongo/Customer');
    require('../src/models_mongo/Complaint');
    require('../src/models_mongo/Machine');
    require('../src/models_mongo/ApiLog');
    require('../src/models_mongo/Session');

    // Initialize settings
    if (Settings && typeof Settings.initializeDefaults === 'function') {
      await Settings.initializeDefaults();
    }

    // Load routes
    const authRoutes = require('../src/routes/auth');
    const userRoutes = require('../src/routes/users');
    const customerRoutes = require('../src/routes/customers');
    const machineRoutes = require('../src/routes/machines');
    const complaintRoutes = require('../src/routes/complaints');
    const leaveRoutes = require('../src/routes/leaves');
    const workTimeRoutes = require('../src/routes/workTime');
    const uploadRoutes = require('../src/routes/uploads');
    const skillRoutes = require('../src/routes/skills');
    const serviceHistoryRoutes = require('../src/routes/serviceHistory');
    const checklistRoutes = require('../src/routes/checklists');
    const duplicateRoutes = require('../src/routes/duplicates');
    const dashboardRoutes = require('../src/routes/dashboard');
    const settingsRoutes = require('../src/routes/settings');
    const systemRoutes = require('../src/routes/system');

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/machines', machineRoutes);
    app.use('/api/complaints', complaintRoutes);
    app.use('/api/leaves', leaveRoutes);
    app.use('/api/worktime', workTimeRoutes);
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/skills', skillRoutes);
    app.use('/api/service-history', serviceHistoryRoutes);
    app.use('/api/checklists', checklistRoutes);
    app.use('/api/duplicates', duplicateRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/system', systemRoutes);

    console.log('✅ Routes initialized');
  } catch (err) {
    console.error('❌ Initialization error:', err.message);
    throw err;
  }
}

// Initialize on first request
app.use(async (req, res, next) => {
  await initializeRoutes();
  next();
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Export for Vercel
module.exports = app;
