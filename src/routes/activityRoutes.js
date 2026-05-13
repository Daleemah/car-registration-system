const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const { ActivityLogger, CentralLog } = require('../services/activityLogService');
const asyncHandler = require('../utils/asyncHandler');

// Get activities for a specific registration
router.get('/registrations/:id/activities', protect, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50, skip = 0, action } = req.query;
  
  const result = await ActivityLogger.getDocumentLogs(id, 'Registration', {
    limit,
    skip,
    action
  });
  
  res.status(200).json({ success: true, data: result });
}));

// Get current user's activities (includes login, logout, profile updates)
router.get('/my-activities', protect, asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0, collection, action } = req.query;
  
  const result = await ActivityLogger.getUserActivities(req.user._id, {
    limit,
    skip,
    collection,
    action
  });
  
  res.status(200).json({ success: true, data: result });
}));

// Get user session statistics
router.get('/my-session-stats', protect, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const stats = await ActivityLogger.getUserSessionStats(req.user._id, {
    startDate,
    endDate
  });
  
  res.status(200).json({ success: true, data: stats });
}));

// Get all system activities (admin only)
router.get('/all-activities', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { 
    limit = 50, 
    skip = 0, 
    collection, 
    action, 
    userId,
    startDate,
    endDate 
  } = req.query;
  
  const result = await ActivityLogger.getAllActivities({
    limit,
    skip,
    collection,
    action,
    userId,
    startDate,
    endDate
  });
  
  res.status(200).json({ success: true, data: result });
}));

// Get user login history (admin only)
router.get('/user-logins/:userId', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50, skip = 0 } = req.query;
  
  const result = await ActivityLogger.getDocumentLogs(userId, 'User', {
    limit,
    skip,
    action: { $in: ['login', 'login_failed', 'logout'] }
  });
  
  res.status(200).json({ success: true, data: result });
}));

// Get activity statistics (admin only)
router.get('/activity-stats', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const stats = await CentralLog.aggregate([
    {
      $group: {
        _id: { action: '$action', collection: '$collection' },
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
  
  // Get today's activity count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayActivities = await CentralLog.countDocuments({
    performedAt: { $gte: today }
  });
  
  res.status(200).json({ 
    success: true, 
    data: {
      summary: stats,
      todayActivities,
      totalLogs: await CentralLog.countDocuments()
    }
  });
}));

module.exports = router;