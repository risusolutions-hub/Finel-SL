
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { requireLogin, loadCurrentUser, roleAtLeast } = require('../middleware/auth');
// ============ SECURITY SCAN ============
// (moved below superadminOnly definition)

/**
 * System Routes - Admin dashboard features
 * /api/system
 */

// Middleware
router.use(loadCurrentUser);
router.use(requireLogin);

// Superadmin only middleware
const superadminOnly = (req, res, next) => {
  if (req.currentUser?.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
};

// ============ AUDIT LOGS ============
router.get('/audit-logs', superadminOnly, systemController.getAuditLogs);
router.get('/audit-logs/export', superadminOnly, systemController.exportAuditLogs);

// ============ API LOGS ============
router.get('/api-logs', superadminOnly, systemController.getApiLogs);
router.get('/api-metrics', superadminOnly, systemController.getApiMetrics);

// ============ SYSTEM CONFIG ============
router.get('/config', superadminOnly, systemController.getSystemConfig);
router.put('/config', superadminOnly, systemController.updateSystemConfig);


// ============ USER SESSIONS ============
router.get('/sessions', superadminOnly, systemController.getActiveSessions);
router.delete('/sessions/:userId', superadminOnly, systemController.terminateSession);

// ============ SECURITY SCAN ============
router.get('/security-scan', superadminOnly, systemController.securityScan);

// ============ HEALTH CHECK ============
router.get('/health', systemController.getHealthStatus);

module.exports = router;
