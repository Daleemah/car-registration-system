const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const { Registration } = require('../models/registrationModel');
const expiryService = require('../services/expiryNotificationService');

// Get expiring registrations (Admin/Staff only)
router.get('/expiring', protect, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + parseInt(days));
    
    const expiringRegistrations = await Registration.find({
      status: 'approved',
      expiresAt: {
        $lte: targetDate,
        $gte: new Date()
      }
    }).populate('applicantId', 'fullName email phone');
    
    res.json({
      success: true,
      data: expiringRegistrations,
      count: expiringRegistrations.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get expiry statistics (Admin/Staff only)
router.get('/stats', protect, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const stats = await expiryService.getExpiryStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manually trigger expiry check (Admin only)
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

// Get notifications for current user
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