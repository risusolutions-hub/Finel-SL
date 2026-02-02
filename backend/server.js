require('dotenv').config();

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason && (reason.stack || reason.message || reason));
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const { connectMongo } = require('./src/config/mongo');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;
// Toggle request logging (set ENABLE_REQUEST_LOGS=true to enable)
const ENABLE_REQUEST_LOGS = String(process.env.ENABLE_REQUEST_LOGS || 'false').toLowerCase() === 'true';

// Redirect console.log and console.error to server.log
const logStream = fs.createWriteStream(path.join(__dirname, 'server.log'), { flags: 'a' });
console.log = function (...args) {
  try {
    const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    const line = `${new Date().toISOString()} - ${msg}\n`;
    logStream.write(line);
    process.stdout.write(`${msg}\n`);
  } catch (e) {
    const fallback = `${new Date().toISOString()} - [LOG ERROR]`;
    logStream.write(fallback + '\n');
    process.stdout.write('[LOG ERROR]\n');
  }
};
console.error = (...args) => console.log(...args);


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

// app.get('/', (req, res) => res.json({ ok: true }));

// Auto-checkout scheduler - runs every minute to check for 7pm auto-checkout
async function autoCheckoutAllEngineers() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Run at 7:00 PM (19:00)
  if (hour === 19 && minute === 0) {
    console.log('[Auto-Checkout] Running 7:00 PM auto-checkout...');
    try {
      // Find all users who are still checked in (Mongoose)
      const checkedInUsers = await User.find({ isCheckedIn: true }).exec();

      for (const user of checkedInUsers) {
        const checkoutTime = new Date(now);
        checkoutTime.setHours(19, 0, 0, 0);

        const checkInTime = user.lastCheckIn ? new Date(user.lastCheckIn) : checkoutTime;
        const duration = Math.floor((checkoutTime - checkInTime) / 60000);

        user.lastCheckOut = checkoutTime;
        user.isCheckedIn = false;
        user.dailyLastCheckOut = checkoutTime;
        user.dailyTotalWorkTime = (user.dailyTotalWorkTime || 0) + duration;
        user.activeTime = (user.activeTime || 0) + duration;

        await user.save();

        // Save or update daily work time record (Mongoose)
        const today = now.toISOString().split('T')[0];
        let record = await DailyWorkTime.findOne({ engineerId: user._id || user.id, workDate: today }).exec();
        if (!record) {
          record = new DailyWorkTime({
            engineerId: user._id || user.id,
            workDate: today,
            firstCheckIn: user.dailyFirstCheckIn,
            lastCheckOut: user.dailyLastCheckOut,
            totalWorkTimeMinutes: user.dailyTotalWorkTime,
            checkInCheckOutLog: []
          });
        } else {
          record.lastCheckOut = user.dailyLastCheckOut;
          record.totalWorkTimeMinutes = user.dailyTotalWorkTime;
        }
        await record.save();

        console.log(`[Auto-Checkout] User ${user.name} (ID: ${user._id || user.id}) auto-checked out. Worked: ${duration} minutes`);
      }

      if (checkedInUsers.length > 0) {
        console.log(`[Auto-Checkout] Completed. ${checkedInUsers.length} users auto-checked out.`);
      }
    } catch (err) {
      console.error('[Auto-Checkout] Error:', err);
    }
  }
}

// Schedule auto-checkout check every minute
setInterval(autoCheckoutAllEngineers, 60 * 1000);

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
    const uploadRoutes = require('./src/routes/uploads');
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
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/skills', skillRoutes);
    app.use('/api/service-history', serviceHistoryRoutes);
    app.use('/api/checklists', checklistRoutes);
    app.use('/api/duplicates', duplicateRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/settings', settingsRoutes);
    app.use('/api/system', systemRoutes);

    app.listen(PORT, ()=> console.log(`Server listening on ${PORT}`));
  }catch(err){
    console.error('Failed to start:', err && (err.stack || err.message || err));
    process.exit(1);
  }
}

start();
