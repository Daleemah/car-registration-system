const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const { Registration } = require('../models/registrationModel');
const expiryService = require('../services/expiryNotificationService');

/**
 * @swagger
 * /api/expiry/expiring:
 *   get:
 *     summary: Get registrations expiring within N days (Staff/Admin only)
 *     tags: [Expiry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30 }
 *         description: Look-ahead window in days
 *     responses:
 *       200:
 *         description: List of soon-to-expire registrations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count:   { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Registration' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/expiring', protect, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));

    const expiringRegistrations = await Registration.find({
      status: 'approved',
      expiresAt: { $lte: targetDate, $gte: new Date() }
    }).populate('applicantId', 'fullName email phone');

    res.json({ success: true, data: expiringRegistrations, count: expiringRegistrations.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/expiry/stats:
 *   get:
 *     summary: Get expiry statistics (Staff/Admin only)
 *     tags: [Expiry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiry stats grouped by time bucket
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', protect, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const stats = await expiryService.getExpiryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/expiry/check:
 *   post:
 *     summary: Manually trigger the expiry notification job (Admin only)
 *     tags: [Expiry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expiry check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     notificationsSent: { type: integer }
 *                     expiredFound:      { type: integer }
 *                     expiredNotified:   { type: integer }
 *                     errors:            { type: array, items: { type: string } }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/check', protect, requireRole('admin'), async (req, res) => {
  try {
    const results = await expiryService.checkExpiringRegistrations();
    const expiredResults = await expiryService.checkExpiredRegistrations();

    res.json({
      success: true,
      message: 'Expiry check completed',
      data: {
        notificationsSent: results.notificationsSent,
        expiredFound: expiredResults.expired,
        expiredNotified: expiredResults.notificationsSent,
        errors: results.errors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/expiry/my-warnings:
 *   get:
 *     summary: Get expiry warnings for the current user's approved registrations
 *     tags: [Expiry]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expiry warnings for the authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       registrationId: { type: string }
 *                       plateNumber:    { type: string }
 *                       vehicle:        { type: string, example: Toyota Camry }
 *                       expiryDate:     { type: string, format: date-time }
 *                       daysRemaining:  { type: integer }
 */
router.get('/my-warnings', protect, async (req, res) => {
  try {
    const registrations = await Registration.find({
      applicantId: req.user._id,
      status: 'approved',
      expiresAt: { $gte: new Date() }
    }).select('plateNumber vehicle expiresAt notificationSent');

    const warnings = registrations.map(reg => ({
      registrationId: reg._id,
      plateNumber: reg.plateNumber,
      vehicle: `${reg.vehicle.make} ${reg.vehicle.model}`,
      expiryDate: reg.expiresAt,
      daysRemaining: Math.ceil((reg.expiresAt - new Date()) / (1000 * 60 * 60 * 24)),
      notificationsSent: Array.from(reg.notificationSent?.entries() || [])
    }));

    res.json({ success: true, data: warnings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
