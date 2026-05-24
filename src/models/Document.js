const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['proof_of_ownership', 'national_id', 'insurance', 'inspection_report', 'tax_clearance', 'other']
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  mimeType: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String
  }
}, { timestamps: true });

// Index for efficient queries
documentSchema.index({ vehicleId: 1, status: 1 });
documentSchema.index({ submittedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);