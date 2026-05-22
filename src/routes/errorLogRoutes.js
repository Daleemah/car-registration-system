const express = require('express');
const router = express.Router();
const ErrorLogService = require('../services/errorLogService');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// Get error statistics (admin only)
router.get('/statistics', protect, requireRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await ErrorLogService.getStatistics(startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get errors with filters (admin only)
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

// Get single error by ID (admin only)
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

// Resolve error (admin only)
router.put('/:errorId/resolve', protect, requireRole('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const error = await ErrorLogService.resolveError(
      req.params.errorId,
      req.user._id,
      notes
    );
    res.json({ success: true, data: error });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clean old logs (admin only)
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

module.exports = router;