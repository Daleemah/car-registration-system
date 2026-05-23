const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middlewares/authMiddleware');
const { validateBody } = require('../utils/validate');
const { z } = require('zod');

const {
  submitDocument,
  getVehicleDocuments,
  getAllDocuments,
  getDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
  getDocumentStats
} = require('../controllers/documentController');

// Validation schemas
const submitDocumentSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  documentType: z.enum(['proof_of_ownership', 'national_id', 'insurance', 'inspection_report', 'tax_clearance', 'other']),
  fileUrl: z.string().url('Valid file URL is required'),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  notes: z.string().optional()
});

const rejectDocumentSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters')
});

// ==================== USER ROUTES ====================
// Submit a document (authenticated users)
router.post('/', protect, validateBody(submitDocumentSchema), submitDocument);

// Get documents for a specific vehicle (owner or admin/staff)
router.get('/vehicle/:vehicleId', protect, getVehicleDocuments);

// Get a single document
router.get('/:id', protect, getDocument);

// Delete a document (owner of pending docs or admin)
router.delete('/:id', protect, deleteDocument);

// ==================== STAFF/ADMIN ROUTES ====================
// Get all documents (with filters)
router.get('/', protect, requireRole('admin', 'staff'), getAllDocuments);

// Verify a document
router.put('/:id/verify', protect, requireRole('admin', 'staff'), verifyDocument);

// Reject a document
router.put('/:id/reject', protect, requireRole('admin', 'staff'), validateBody(rejectDocumentSchema), rejectDocument);

// Get document statistics
router.get('/stats/overview', protect, requireRole('admin'), getDocumentStats);

module.exports = router;