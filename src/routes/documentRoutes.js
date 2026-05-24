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

// ── Static / collection routes MUST come before /:id ──────────────────────

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all documents with filters (Staff/Admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *       - in: query
 *         name: documentType
 *         schema:
 *           type: string
 *           enum: [proof_of_ownership, national_id, insurance, inspection_report, tax_clearance, other]
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Document' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/', protect, requireRole('admin', 'staff'), getAllDocuments);

/**
 * @swagger
 * /api/documents/stats/overview:
 *   get:
 *     summary: Get document statistics overview (Admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document stats (counts by status and type)
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats/overview', protect, requireRole('admin'), getDocumentStats);

// ── User routes ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Submit a document for a vehicle registration
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, documentType, fileUrl]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 description: The registration (_id) this document belongs to
 *                 example: 664f1a2b3c4d5e6f7a8b9c0d
 *               documentType:
 *                 type: string
 *                 enum: [proof_of_ownership, national_id, insurance, inspection_report, tax_clearance, other]
 *                 example: proof_of_ownership
 *               fileUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/myfile.pdf
 *               fileName:  { type: string, example: ownership.pdf }
 *               fileSize:  { type: integer, example: 204800 }
 *               mimeType:  { type: string, example: application/pdf }
 *               notes:     { type: string, example: Original title document }
 *     responses:
 *       201:
 *         description: Document submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:    { $ref: '#/components/schemas/Document' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/', protect, validateBody(submitDocumentSchema), submitDocument);

/**
 * @swagger
 * /api/documents/vehicle/{vehicleId}:
 *   get:
 *     summary: Get all documents for a specific vehicle registration
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string }
 *         description: Registration ID
 *     responses:
 *       200:
 *         description: Documents for the vehicle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Document' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/vehicle/:vehicleId', protect, getVehicleDocuments);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a single document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:    { $ref: '#/components/schemas/Document' }
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', protect, getDocument);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document (owner of pending docs or admin)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Document deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', protect, deleteDocument);

// ── Staff/Admin routes ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/documents/{id}/verify:
 *   put:
 *     summary: Verify a document (Staff/Admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Document verified
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:id/verify', protect, requireRole('admin', 'staff'), verifyDocument);

/**
 * @swagger
 * /api/documents/{id}/reject:
 *   put:
 *     summary: Reject a document with a reason (Staff/Admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 minLength: 5
 *                 example: Document appears to be altered
 *     responses:
 *       200:
 *         description: Document rejected
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put('/:id/reject', protect, requireRole('admin', 'staff'), validateBody(rejectDocumentSchema), rejectDocument);

module.exports = router;
