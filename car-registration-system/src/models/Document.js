const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({

  vehicleId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Registration',
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
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},

}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);0

