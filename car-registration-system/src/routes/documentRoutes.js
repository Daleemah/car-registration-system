const express = require('express');
const router = express.Router();

const {
  submitDocument,
  getVehicleDocuments,
  verifyDocument,
  rejectDocument
} = require('../controllers/documentController');

const { protect, requireRole } = require('../middlewares/authMiddleware');

// Submit document
router.post('/', protect, submitDocument);

// Get documents for a vehicle
router.get('/:vehicleId', protect, getVehicleDocuments);

// Verify document (staff only)
router.put('/:id/verify', protect, requireRole('staff'), verifyDocument);

// Reject document (staff only)
router.put('/:id/reject', protect, requireRole('staff'), rejectDocument);

module.exports = router;0

