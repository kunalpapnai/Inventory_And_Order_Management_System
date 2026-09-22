const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard is monitored by Admin as defined in PRD Section 1 & Section 3.2
router.get('/stats', authenticate, authorize('Admin'), dashboardController.getDashboardStats);

module.exports = router;
