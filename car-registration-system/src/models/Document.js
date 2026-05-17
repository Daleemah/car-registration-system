const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({

  vehicleId: {
    type: String,
    required: true
  },

  documentType: {
    type: String,
    required: true
  },

  fileUrl: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },

  submittedBy: {
    type: String,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);0

