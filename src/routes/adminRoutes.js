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

router.use(protect);
router.use(requireRole('admin'));

/**
 * @swagger
 * /api/admin/dashboard/stats:
 *   get:
 *     summary: Comprehensive dashboard statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats object
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/dashboard/stats', getDashboardStats);

/**
 * @swagger
 * /api/admin/dashboard/activities:
 *   get:
 *     summary: Recent system activities (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity entries
 */
router.get('/dashboard/activities', getRecentActivities);

/**
 * @swagger
 * /api/admin/analytics/trends:
 *   get:
 *     summary: Registration trends over time (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Trend data points
 */
router.get('/analytics/trends', getRegistrationTrends);

/**
 * @swagger
 * /api/admin/analytics/vehicle-distribution:
 *   get:
 *     summary: Vehicle class distribution (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Counts per vehicle class
 */
router.get('/analytics/vehicle-distribution', getVehicleClassDistribution);

/**
 * @swagger
 * /api/admin/analytics/top-users:
 *   get:
 *     summary: Users with the most registrations (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top users by registration count
 */
router.get('/analytics/top-users', getTopUsers);

/**
 * @swagger
 * /api/admin/analytics/revenue:
 *   get:
 *     summary: Revenue breakdown by period and vehicle class (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Revenue breakdown data
 */
router.get('/analytics/revenue', getRevenueBreakdown);

/**
 * @swagger
 * /api/admin/analytics/user-activity:
 *   get:
 *     summary: User activity summary across the system (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User activity summary
 */
router.get('/analytics/user-activity', getUserActivitySummary);

/**
 * @swagger
 * /api/admin/export/{type}:
 *   get:
 *     summary: Export data as CSV (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [registrations, users, documents]
 *         description: Dataset to export
 *     responses:
 *       200:
 *         description: CSV file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/export/:type', exportData);

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: System health check with DB and service status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:   { type: string, example: healthy }
 *                 uptime:   { type: number }
 *                 database: { type: string, example: connected }
 */
router.get('/health', getSystemHealth);

module.exports = router;
