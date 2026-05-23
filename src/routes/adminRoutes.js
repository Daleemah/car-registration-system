const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const {
  getDashboardStats,
  getRecentActivities,
  getRegistrationTrends,
  getVehicleClassDistribution,
  getTopUsers,
  getRevenueBreakdown,
  getUserActivitySummary,
  exportData,
  getSystemHealth,
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(protect);
router.use(requireRole('admin'));

// Dashboard overview
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activities', getRecentActivities);

// Analytics and reports
router.get('/analytics/trends', getRegistrationTrends);
router.get('/analytics/vehicle-distribution', getVehicleClassDistribution);
router.get('/analytics/top-users', getTopUsers);
router.get('/analytics/revenue', getRevenueBreakdown);
router.get('/analytics/user-activity', getUserActivitySummary);

// Export data
router.get('/export/:type', exportData);

// System health
router.get('/health', getSystemHealth);

module.exports = router;