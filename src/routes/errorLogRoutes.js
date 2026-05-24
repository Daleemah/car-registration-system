const express = require('express');
const router = express.Router();
const ErrorLogService = require('../services/errorLogService');
const { protect, requireRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/error-logs/statistics:
 *   get:
 *     summary: Error log statistics by severity, service, and time (Admin only)
 *     tags: [Error Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Error statistics
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/statistics', protect, requireRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await ErrorLogService.getStatistics(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /clean MUST come before DELETE /:errorId to avoid route shadowing
/**
 * @swagger
 * /api/error-logs/clean:
 *   delete:
 *     summary: Delete error logs older than N days (Admin only)
 *     tags: [Error Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysToKeep:
 *                 type: integer
 *                 default: 30
 *                 example: 30
 *     responses:
 *       200:
 *         description: Old logs deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:      { type: boolean }
 *                 message:      { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount: { type: integer }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/clean', protect, requireRole('admin'), async (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;
    const deletedCount = await ErrorLogService.cleanOldLogs(daysToKeep);
    res.json({
      success: true,
      message: `Deleted ${deletedCount} old error logs`,
      data: { deletedCount }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/error-logs:
 *   get:
 *     summary: Get error logs with filters (Admin only)
 *     tags: [Error Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *       - in: query
 *         name: severity
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: service
 *         schema: { type: string, example: auth }
 *       - in: query
 *         name: resolved
 *         schema: { type: boolean }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Filtered error log entries
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const filters = {
      service: req.query.service,
      operation: req.query.operation,
      severity: req.query.severity,
      resolved: req.query.resolved,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      userId: req.query.userId,
      errorName: req.query.errorName
    };
    const pagination = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };
    const result = await ErrorLogService.getErrors(filters, pagination);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/error-logs/{errorId}:
 *   get:
 *     summary: Get a single error log entry by ID (Admin only)
 *     tags: [Error Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Error log entry
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:errorId', protect, requireRole('admin'), async (req, res) => {
  try {
    const error = await ErrorLogService.getErrorById(req.params.errorId);
    if (!error) {
      return res.status(404).json({ success: false, message: 'Error not found' });
    }
    res.json({ success: true, data: error });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/error-logs/{errorId}/resolve:
 *   put:
 *     summary: Mark an error log entry as resolved (Admin only)
 *     tags: [Error Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: errorId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string, example: Fixed in v1.2 }
 *     responses:
 *       200:
 *         description: Error marked as resolved
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:errorId/resolve', protect, requireRole('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const error = await ErrorLogService.resolveError(req.params.errorId, req.user._id, notes);
    res.json({ success: true, data: error });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
