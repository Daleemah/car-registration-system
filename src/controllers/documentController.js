const Document = require('../models/Document');
const { Registration } = require('../models/registrationModel');
const { ActivityLogger } = require('../services/activityLogService');
const { asyncHandler } = require('../utils/asyncHandler');

// 📌 Submit document (User)
const submitDocument = asyncHandler(async (req, res) => {
  const { vehicleId, documentType, fileUrl, fileName, fileSize, mimeType, notes } = req.body;

  // Validate vehicle exists and belongs to user
  const vehicle = await Registration.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  // Check if user owns the vehicle or is admin/staff
  if (req.user.role === 'user' && String(vehicle.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const document = await Document.create({
    vehicleId,
    documentType,
    fileUrl,
    fileName,
    fileSize,
    mimeType,
    submittedBy: req.user._id,
    notes,
    status: 'pending'
  });

  // Populate submittedBy info
  await document.populate('submittedBy', 'fullName email');

  // Log activity
  await ActivityLogger.log(
    vehicle,
    'document_submitted',
    req.user._id,
    `Document submitted: ${documentType}`,
    vehicle.status,
    vehicle.status,
    {
      additionalData: { documentId: document._id, documentType, fileUrl }
    }
  );

  res.status(201).json({ success: true, data: document });
});

// 📌 Get documents for a vehicle
const getVehicleDocuments = asyncHandler(async (req, res) => {
  const { vehicleId } = req.params;

  // Validate vehicle exists
  const vehicle = await Registration.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }

  // Check permission
  if (req.user.role === 'user' && String(vehicle.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const documents = await Document.find({ vehicleId })
    .populate('submittedBy', 'fullName email')
    .populate('verifiedBy', 'fullName email')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: documents.length, data: documents });
});

// 📌 Get all documents (Admin only)
const getAllDocuments = asyncHandler(async (req, res) => {
  const { status, documentType, page = 1, limit = 20 } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (documentType) query.documentType = documentType;

  const skip = (page - 1) * limit;

  const [documents, total] = await Promise.all([
    Document.find(query)
      .populate('submittedBy', 'fullName email')
      .populate('verifiedBy', 'fullName email')
      .populate('vehicleId', 'plateNumber vehicle.make vehicle.model')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Document.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: documents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 📌 Get single document
const getDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id)
    .populate('submittedBy', 'fullName email')
    .populate('verifiedBy', 'fullName email')
    .populate('vehicleId', 'plateNumber vehicle.make vehicle.model vehicle.vin');

  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Check permission
  const vehicle = await Registration.findById(document.vehicleId);
  if (req.user.role === 'user' && String(vehicle.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  res.json({ success: true, data: document });
});

// 📌 Verify document (Staff/Admin only)
const verifyDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const document = await Document.findById(id);
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  document.status = 'verified';
  document.verifiedBy = req.user._id;
  document.verifiedAt = new Date();
  if (notes) document.notes = notes;
  await document.save();

  await document.populate('verifiedBy', 'fullName email');
  await document.populate('submittedBy', 'fullName email');

  // Log activity
  const vehicle = await Registration.findById(document.vehicleId);
  await ActivityLogger.log(
    vehicle,
    'document_verified',
    req.user._id,
    `Document verified: ${document.documentType}`,
    vehicle.status,
    vehicle.status,
    {
      additionalData: { documentId: document._id, documentType: document.documentType }
    }
  );

  res.json({ success: true, message: 'Document verified successfully', data: document });
});

// 📌 Reject document (Staff/Admin only)
const rejectDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required' });
  }

  const document = await Document.findById(id);
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  document.status = 'rejected';
  document.rejectionReason = rejectionReason;
  document.verifiedBy = req.user._id;
  document.verifiedAt = new Date();
  await document.save();

  await document.populate('verifiedBy', 'fullName email');
  await document.populate('submittedBy', 'fullName email');

  // Log activity
  const vehicle = await Registration.findById(document.vehicleId);
  await ActivityLogger.log(
    vehicle,
    'document_rejected',
    req.user._id,
    `Document rejected: ${document.documentType}. Reason: ${rejectionReason}`,
    vehicle.status,
    vehicle.status,
    {
      additionalData: { documentId: document._id, documentType: document.documentType, rejectionReason }
    }
  );

  res.json({ success: true, message: 'Document rejected', data: document });
});

// 📌 Delete document (User can delete their own pending docs, Admin can delete any)
const deleteDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const document = await Document.findById(id);
  if (!document) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  // Check permission
  const vehicle = await Registration.findById(document.vehicleId);
  const isOwner = req.user.role === 'user' && String(vehicle.applicantId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Users can only delete pending documents
  if (req.user.role === 'user' && document.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Cannot delete verified/rejected documents' });
  }

  await document.deleteOne();

  res.json({ success: true, message: 'Document deleted successfully' });
});

// 📌 Get document statistics (Admin only)
const getDocumentStats = asyncHandler(async (req, res) => {
  const stats = await Document.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const byType = await Document.aggregate([
    {
      $group: {
        _id: '$documentType',
        count: { $sum: 1 },
        verified: { $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      byStatus: stats,
      byType,
      total: await Document.countDocuments()
    }
  });
});

module.exports = {
  submitDocument,
  getVehicleDocuments,
  getAllDocuments,
  getDocument,
  verifyDocument,
  rejectDocument,
  deleteDocument,
  getDocumentStats
};