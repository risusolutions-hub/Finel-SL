// ============ SECURITY SCAN ============

// Detect suspicious accounts (e.g., duplicate emails, blocked, never logged in, etc.)
exports.securityScan = async (req, res) => {
  try {
    const { User } = require('../models_mongo');
    // Find users with suspicious patterns
    const suspicious = [];
    // 1. Blocked users
    const blocked = await User.find({ status: 'blocked' }).lean().exec();
    blocked.forEach(u => suspicious.push({ reason: 'Blocked', user: u }));
    // 2. Never logged in
    const neverLoggedIn = await User.find({ lastLoginAt: { $exists: false } }).lean().exec();
    neverLoggedIn.forEach(u => suspicious.push({ reason: 'Never logged in', user: u }));
    // 3. Duplicate emails
    const allUsers = await User.find({}).select('email name role status').lean().exec();
    const emailMap = {};
    allUsers.forEach(u => {
      if (!emailMap[u.email]) emailMap[u.email] = [];
      emailMap[u.email].push(u);
    });
    Object.values(emailMap).forEach(arr => {
      if (arr.length > 1) arr.forEach(u => suspicious.push({ reason: 'Duplicate email', user: u }));
    });
    // 4. Admins with default password (if passwordHash is short)
    const admins = await User.find({ role: { $in: ['admin','superadmin'] } }).lean().exec();
    admins.forEach(u => {
      if (u.passwordHash && u.passwordHash.length < 20) {
        suspicious.push({ reason: 'Admin with weak/default password', user: u });
      }
    });
    res.json({ success: true, suspicious });
  } catch (error) {
    console.error('Security scan failed:', error);
    res.status(500).json({ success: false, message: 'Security scan failed', suspicious: [] });
  }
};
const { AuditLog: SQLAuditLog, ApiLog: SQLApiLog, SystemConfig: SQLSystemConfig, User: SQLUser, sequelize } = require('../models');
let Op;
try{ ({ Op } = require('sequelize')); }catch(e){ Op = {}; }
const os = require('os');
const { mongoose } = require('../models_mongo');
const AuditLogModel = mongoose.models.AuditLog || mongoose.model('AuditLog', new mongoose.Schema({}, { strict: false, timestamps: true }));
const ApiLogModel = mongoose.models.ApiLog || mongoose.model('ApiLog', new mongoose.Schema({}, { strict: false, timestamps: true }));
const SystemConfigModel = mongoose.models.SystemConfig || mongoose.model('SystemConfig', new mongoose.Schema({}, { strict: false, timestamps: true }));
const UserModel = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false, timestamps: true }));

/**
 * System Controller - Handles system admin features
 * Only superadmin can access these endpoints
 */

// ============ AUDIT LOGS ============

// Get audit logs with filtering
exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, resource, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    let count = 0;
    let rows = [];
    try{
      count = await AuditLogModel.countDocuments(where).catch(()=>0);
      rows = await AuditLogModel.find(where).sort({ createdAt: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).lean().exec().catch(()=>[]);
    }catch(e){
      try{
        const result = await SQLAuditLog.findAndCountAll({ where, order: [['createdAt','DESC']], limit: parseInt(limit), offset: parseInt(offset) });
        count = result.count; rows = result.rows;
      }catch(err){
        console.log('AuditLog unavailable:', err.message);
      }
    }

    res.json({ success: true, logs: rows, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count/limit)||1 } });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', logs: [], pagination: {} });
  }
};

// Export audit logs as CSV
exports.exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    let logs = [];
    try{
      logs = await AuditLogModel.find(where).sort({ createdAt: -1 }).limit(10000).lean().exec();
    }catch(e){
      try{ logs = await SQLAuditLog.findAll({ where, order: [['createdAt','DESC']], limit: 10000 }); }catch(err){ console.log('AuditLog export unavailable:', err.message); }
    }

    // Convert to CSV
    const headers = ['Date', 'User', 'Role', 'Action', 'Resource', 'Resource ID', 'Description', 'IP Address'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const row = [
        log.createdAt?.toISOString() || '',
        log.userName || '',
        log.userRole || '',
        log.action || '',
        log.resource || '',
        log.resourceId || '',
        `"${(log.description || '').replace(/"/g, '""')}"`,
        log.ipAddress || ''
      ];
      csvRows.push(row.join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs' });
  }
};

// ============ API LOGS ============

// Get API logs
exports.getApiLogs = async (req, res) => {
  try {
    const { page = 1, limit = 100, endpoint, statusCode, method } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (endpoint) where.endpoint = { [Op.like]: `%${endpoint}%` };
    if (statusCode) where.statusCode = statusCode;
    if (method) where.method = method;

    let count = 0; let rows = [];
    try{
      count = await ApiLogModel.countDocuments(where).catch(()=>0);
      rows = await ApiLogModel.find(where).sort({ createdAt: -1 }).skip(parseInt(offset)).limit(parseInt(limit)).lean().exec().catch(()=>[]);
    }catch(e){
      try{ const result = await SQLApiLog.findAndCountAll({ where, order: [['createdAt','DESC']], limit: parseInt(limit), offset: parseInt(offset) }); count = result.count; rows = result.rows; }catch(err){ console.log('ApiLog unavailable:', err.message); }
    }
    // Add formatted date string for frontend display
    const logs = rows.map(log => ({
      ...log,
      createdAtStr: log.createdAt ? new Date(log.createdAt).toISOString() : ''
    }));
    res.json({ success: true, logs, pagination: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count/limit) } });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API logs', logs: [] });
  }
};

// Get API metrics
exports.getApiMetrics = async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let totalRequests = 0;
    let avgResponseTime = 0;
    let errorCount = 0;
    let topEndpoints = [];
    let statusCodes = [];

    try{
      totalRequests = await ApiLogModel.countDocuments({ createdAt: { $gte: last24h } }).catch(()=>0);
      const avgAgg = await ApiLogModel.aggregate([ { $match: { createdAt: { $gte: last24h } } }, { $group: { _id: null, avg: { $avg: '$responseTime' } } } ]).catch(()=>[]);
      avgResponseTime = Math.round((avgAgg[0]?.avg)||0);
      errorCount = await ApiLogModel.countDocuments({ createdAt: { $gte: last24h }, statusCode: { $gte: 400 } }).catch(()=>0);
      topEndpoints = await ApiLogModel.aggregate([ { $match: { createdAt: { $gte: last24h } } }, { $group: { _id: '$endpoint', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 } ]).catch(()=>[]);
      statusCodes = await ApiLogModel.aggregate([ { $match: { createdAt: { $gte: last24h } } }, { $group: { _id: '$statusCode', count: { $sum: 1 } } }, { $sort: { _id: 1 } } ]).catch(()=>[]);
    }catch(e){
      try{
        totalRequests = await SQLApiLog.count({ where: { createdAt: { [Op.gte]: last24h } } });
        const avgResult = await SQLApiLog.findOne({ attributes: [[sequelize.fn('AVG', sequelize.col('responseTime')), 'avg']], where: { createdAt: { [Op.gte]: last24h } } });
        avgResponseTime = Math.round(avgResult?.dataValues?.avg || 0);
        errorCount = await SQLApiLog.count({ where: { createdAt: { [Op.gte]: last24h }, statusCode: { [Op.gte]: 400 } } });
        topEndpoints = await SQLApiLog.findAll({ attributes: ['endpoint', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], where: { createdAt: { [Op.gte]: last24h } }, group: ['endpoint'], order: [[sequelize.literal('count'),'DESC']], limit: 10 });
        statusCodes = await SQLApiLog.findAll({ attributes: ['statusCode', [sequelize.fn('COUNT', sequelize.col('id')), 'count']], where: { createdAt: { [Op.gte]: last24h } }, group: ['statusCode'], order: [['statusCode','ASC']] });
      }catch(err){ console.log('ApiLog metrics unavailable:', err.message); }
    }

    res.json({
      success: true,
      metrics: {
        totalRequests,
        avgResponseTime,
        errorCount,
        errorRate: totalRequests > 0 ? ((errorCount / totalRequests) * 100).toFixed(2) : 0,
        topEndpoints,
        statusCodes
      }
    });
  } catch (error) {
    console.error('Error fetching API metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch API metrics', metrics: {} });
  }
};

// ============ SYSTEM CONFIG ============

// Get system config
exports.getSystemConfig = async (req, res) => {
  try {
    let config = null;
    try{ config = await SystemConfigModel.findOne().lean().exec().catch(()=>null); }catch(e){ }
    if(!config){
      try{ const doc = new SystemConfigModel({}); await doc.save(); config = doc.toObject(); }catch(e){ try{ config = await SQLSystemConfig.findOne(); if(!config) config = await SQLSystemConfig.create({}); }catch(err){} }
    }
    // Ensure apiLoggingEnabled is always present and defaults to true if missing
    if (config && config.apiLoggingEnabled === undefined) {
      config.apiLoggingEnabled = true;
      try {
        await SystemConfigModel.updateOne({}, { $set: { apiLoggingEnabled: true } });
      } catch (e) {}
    }
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching system config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system config' });
  }
};

// Update system config
exports.updateSystemConfig = async (req, res) => {
  try {
    if (req.currentUser?.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let config = null;
    try{ config = await SystemConfigModel.findOne().exec().catch(()=>null); }catch(e){}
    if(!config){ try{ config = await SQLSystemConfig.findOne(); if(!config) config = await SQLSystemConfig.create({}); }catch(e){} }

    const allowedFields = [
      'maintenanceMode', 'maintenanceMessage', 'maintenanceEndTime',
      'companyName', 'companyLogo', 'footerText',
      'dataRetentionDays', 'auditLogRetentionDays', 'apiLogRetentionDays',
      'debugMode', 'apiLoggingEnabled', 'verboseErrors',
      'autoBackupEnabled', 'backupFrequency', 'backupRetentionCount'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if(config.updateOne) {
      await config.updateOne ? config.updateOne(updates) : config.update(updates);
    } else if (config.update) {
      await config.update(updates);
    }
    // Log the config change
    await createAuditLog(req, 'UPDATE', 'system_config', config.id || config._id, 'Updated system configuration');

    res.json({ success: true, config, message: 'Configuration updated' });
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({ success: false, message: 'Failed to update system config' });
  }
};

// ============ USER SESSIONS ============

// Get active sessions (users who are logged in)
exports.getActiveSessions = async (req, res) => {
  try {
    // Return all active sessions with device/IP info
    const { Session, User } = require('../models_mongo');
    const sessions = await Session.find({ isActive: true }).sort({ lastActiveAt: -1 }).lean().exec();
    // Populate user info
    const userIds = [...new Set(sessions.map(s => s.userId?.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select('id name email role').lean().exec();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });
    const sessionList = sessions.map(s => ({
      ...s,
      user: userMap[s.userId?.toString()] || null
    }));
    res.json({ success: true, sessions: sessionList });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active sessions' });
  }
};

// Terminate user session (force logout)
exports.terminateSession = async (req, res) => {
  try {
    if (req.currentUser?.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { userId } = req.params;
    // userId here is actually the session _id (from frontend)
    const { Session } = require('../models_mongo');
    const session = await Session.findById(userId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    session.isActive = false;
    await session.save();
    await createAuditLog(req, 'TERMINATE_SESSION', 'session', userId, `Terminated session ID ${userId}`);
    res.json({ success: true, message: 'Session terminated' });
  } catch (error) {
    console.error('Error terminating session:', error);
    res.status(500).json({ success: false, message: 'Failed to terminate session' });
  }
};

// ============ HEALTH CHECK ============

// Get system health status
exports.getHealthStatus = async (req, res) => {
  try {
    const startTime = Date.now();

    // Database check (try Mongo primary)
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    try{
      const dbStart = Date.now();
      if(mongoose && mongoose.connection && mongoose.connection.db){
        await mongoose.connection.db.admin().ping();
      } else {
        await sequelize.authenticate();
      }
      dbResponseTime = Date.now() - dbStart;
    }catch(e){ dbStatus = 'unhealthy'; }

    // Memory usage
    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    // CPU load
    const cpuLoad = os.loadavg();

    // Uptime
    const uptime = process.uptime();

    // Recent errors count (with try-catch in case table doesn't exist)
    let recentErrors = 0;
    try{
      recentErrors = await ApiLogModel.countDocuments({ statusCode: { $gte: 500 }, createdAt: { $gte: new Date(Date.now() - 60*60*1000) } }).catch(()=>0);
    }catch(e){
      try{ recentErrors = await SQLApiLog.count({ where: { statusCode: { [Op.gte]: 500 }, createdAt: { [Op.gte]: new Date(Date.now() - 60*60*1000) } } }); }catch(err){}
    }

    // Active users count (with fallback)
    let activeUsers = 0;
    try{ activeUsers = await UserModel.countDocuments({ $or: [ { lastLoginAt: { $gte: new Date(Date.now() - 24*60*60*1000) } }, { updatedAt: { $gte: new Date(Date.now() - 24*60*60*1000) } } ] }).catch(()=>0); }catch(e){ try{ activeUsers = await SQLUser.count(); }catch(err){ activeUsers = 0; } }

    // Get config for maintenance mode
    let config = null;
    try {
      config = await SystemConfig.findOne();
    } catch (e) {
      // Table might not exist
    }

    res.json({
      success: true,
      health: {
        status: dbStatus === 'healthy' && recentErrors < 100 ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        maintenanceMode: config?.maintenanceMode || false,
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024),
          total: Math.round(memUsage.heapTotal / 1024 / 1024),
          system: {
            total: Math.round(totalMem / 1024 / 1024 / 1024),
            free: Math.round(freeMem / 1024 / 1024 / 1024),
            usedPercent: Math.round((1 - freeMem / totalMem) * 100)
          }
        },
        cpu: {
          load1m: cpuLoad[0]?.toFixed(2),
          load5m: cpuLoad[1]?.toFixed(2),
          load15m: cpuLoad[2]?.toFixed(2),
          cores: os.cpus().length
        },
        errors: {
          lastHour: recentErrors
        },
        users: {
          active24h: activeUsers
        },
        responseTime: Date.now() - startTime
      }
    });
  } catch (error) {
    console.error('Error fetching health status:', error);
    res.status(500).json({ 
      success: false, 
      health: { status: 'unhealthy', error: error.message }
    });
  }
};

// ============ HELPER FUNCTIONS ============

// Create audit log entry
async function createAuditLog(req, action, resource, resourceId, description, previousValue = null, newValue = null) {
  try {
    try{
      await AuditLogModel.create({
      userId: req.currentUser?.id,
      userName: req.currentUser?.name,
      userRole: req.currentUser?.role,
      action,
      resource,
      resourceId: String(resourceId),
      description,
      previousValue: previousValue ? JSON.stringify(previousValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      ipAddress: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    }catch(e){
      await SQLAuditLog.create({ userId: req.currentUser?.id, userName: req.currentUser?.name, userRole: req.currentUser?.role, action, resource, resourceId: String(resourceId), description, previousValue: previousValue ? JSON.stringify(previousValue) : null, newValue: newValue ? JSON.stringify(newValue) : null, ipAddress: req.ip || req.connection?.remoteAddress, userAgent: req.get('User-Agent') });
    }
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

// Format uptime to human readable
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  
  return parts.join(' ') || '< 1m';
}

// Export audit log helper for use in other controllers
exports.createAuditLog = createAuditLog;
