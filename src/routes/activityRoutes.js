const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const { ActivityLogger, CentralLog } = require('../services/activityLogService');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * @swagger
 * /api/activities/my-activities:
 *   get:
 *     summary: Get the current user's activity history
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limitQuery'
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: collection
 *         schema: { type: string }
 *         description: Filter by model name (e.g. Registration, User)
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action type (e.g. login, register)
 *     responses:
 *       200:
 *         description: User activity log
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my-activities', protect, asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0, collection, action } = req.query;
  const result = await ActivityLogger.getUserActivities(req.user._id, { limit, skip, collection, action });
  res.status(200).json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/activities/my-session-stats:
 *   get:
 *     summary: Get login/session statistics for the current user
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Session statistics
 */
router.get('/my-session-stats', protect, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const stats = await ActivityLogger.getUserSessionStats(req.user._id, { startDate, endDate });
  res.status(200).json({ success: true, data: stats });
}));

/**
 * @swagger
 * /api/activities/activity-stats:
 *   get:
 *     summary: Get system-wide activity statistics (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated action counts by model and type
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/activity-stats', protect, requireRole('admin'), asyncHandler(async (req, res) => {
  const stats = await CentralLog.aggregate([
    {
      $group: {
        _id: { action: '$action', collection: '$modelName' },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$performedBy' }
      }
    },
    {
      $group: {
        _id: '$_id.collection',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count',
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        totalActions: { $sum: '$count' }
      }
    }
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayActivities = await CentralLog.countDocuments({ performedAt: { $gte: today } });

  res.status(200).json({
    success: true,
    data: {
      summary: stats,
      todayActivities,
      totalLogs: await CentralLog.countDocuments()
    }
  });
}));

/**
 * @swagger
 * /api/activities/all-activities:
 *   get:
 *     summary: Get all system activities with filters (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/limitQuery'
 *       - in: query
 *         name: skip
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: collection
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Paginated activity log
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/all-activities', protect, requireRole('admin'), asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0, collection, action, userId, startDate, endDate } = req.query;
  const result = await ActivityLogger.getAllActivities({ limit, skip, collection, action, userId, startDate, endDate });
  res.status(200).json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/activities/user-logins/{userId}:
 *   get:
 *     summary: Get login history for a specific user (Admin only)
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - $ref: '#/components/parameters/limitQuery'
 *     responses:
 *       200:
 *         description: Login/logout events for the user
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/user-logins/:userId', protect, requireRole('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50, skip = 0 } = req.query;
  const result = await ActivityLogger.getDocumentLogs(userId, 'User', {
    limit, skip,
    action: ['login', 'login_failed', 'logout']
  });
  res.status(200).json({ success: true, data: result });
}));

/**
 * @swagger
 * /api/activities/registrations/{id}/activities:
 *   get:
 *     summary: Get the activity log for a specific registration
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *       - $ref: '#/components/parameters/limitQuery'
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action type
 *     responses:
 *       200:
 *         description: Activity entries for the registration
 */
router.get('/registrations/:id/activities', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, skip = 0, action } = req.query;
  const result = await ActivityLogger.getDocumentLogs(id, 'Registration', { limit, skip, action });
  res.status(200).json({ success: true, data: result });
}));

module.exports = router;
