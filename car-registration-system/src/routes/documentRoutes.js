const express = require('express');
const router = express.Router();

const {
  submitDocument,
  getVehicleDocuments,
  verifyDocument,
  rejectDocument,
  deleteAllDocuments
} = require('../controllers/documentController');


// Submit document
router.post('/', submitDocument);
// Get documents for a vehicle
router.get('/:vehicleId', getVehicleDocuments);
// Verify document (staff only)
router.put('/:id/verify', verifyDocument);
// Reject document (staff only)
router.put('/:id/reject', rejectDocument);
module.exports = router;
router.delete('/clear', deleteAllDocuments);
