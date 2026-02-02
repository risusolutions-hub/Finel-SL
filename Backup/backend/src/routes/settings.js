const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { requireLogin, loadCurrentUser } = require('../middleware/auth');

/**
 * Settings Routes
 * /api/settings
 */

// Middleware to load current user for all routes
router.use(loadCurrentUser);

// Get all settings (requires auth)
router.get('/', requireLogin, settingsController.getAllSettings);

// Get feature settings only (for checking feature availability) - public
// This endpoint should be accessible without authentication so the frontend
// can determine available features before user login.
router.get('/features', settingsController.getFeatureSettings);

// Update a single setting (super_admin only)
router.put('/:key', requireLogin, settingsController.updateSetting);

// Bulk update settings (super_admin only)
router.put('/', requireLogin, settingsController.bulkUpdateSettings);

module.exports = router;
