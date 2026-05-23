const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
vehicleId: {
  type: String
},  
  documentType: String,
  fileUrl: String,
  status: {
    type: String,
    default: 'pending'
  },
  submittedBy: {
    type: String
},
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
