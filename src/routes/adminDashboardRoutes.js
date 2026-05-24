const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middlewares/authMiddleware");
const controller = require("../controllers/adminDashboardControllers");

/**
 * @swagger
 * /api/admin/dashboard/overview:
 *   get:
 *     summary: Simplified dashboard overview (Admin only)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: High-level counts and totals
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get("/overview", protect, requireRole("admin"), controller.getOverview);

/**
 * @swagger
 * /api/admin/dashboard/monthly:
 *   get:
 *     summary: Monthly registration counts for the current year (Admin only)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of monthly counts
 */
router.get("/monthly", protect, requireRole("admin"), controller.getMonthly);

/**
 * @swagger
 * /api/admin/dashboard/top-models:
 *   get:
 *     summary: Top vehicle makes and models by registration count (Admin only)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ranked list of vehicle models
 */
router.get("/top-models", protect, requireRole("admin"), controller.getTopModels);

/**
 * @swagger
 * /api/admin/dashboard/status:
 *   get:
 *     summary: Registration counts grouped by status (Admin only)
 *     tags: [Admin Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status breakdown
 */
router.get("/status", protect, requireRole("admin"), controller.getStatus);

module.exports = router;
