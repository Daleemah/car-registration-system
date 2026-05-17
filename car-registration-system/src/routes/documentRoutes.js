const express = require('express');

const router = express.Router();

const {
  submitDocument,
  getVehicleDocuments,
  verifyDocument,
  rejectDocument
} = require('../controllers/documentController');

router.post('/', submitDocument);

router.get('/:vehicleId', getVehicleDocuments);

router.put('/:id/verify', verifyDocument);

router.put('/:id/reject', rejectDocument);

module.exports = router;0

