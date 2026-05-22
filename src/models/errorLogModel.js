const mongoose = require('mongoose');

const errorLogSchema = new mongoose.Schema({
  errorId: { type: String, required: true, unique: true, index: true },
  errorName: { type: String, required: true, index: true },
  errorMessage: { type: String, required: true },
  errorStack: { type: String },
  
  request: {
    method: { type: String },
    url: { type: String },
    path: { type: String, index: true },
    query: { type: mongoose.Schema.Types.Mixed },
    params: { type: mongoose.Schema.Types.Mixed },
    body: { type: mongoose.Schema.Types.Mixed },
    headers: {
      userAgent: { type: String },
      referer: { type: String },
      origin: { type: String }
    },
    ip: { type: String, index: true },
    timestamp: { type: Date, default: Date.now }
  },
  
  user: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String },
    role: { type: String }
  },
  
  context: {
    service: { type: String, index: true },
    operation: { type: String, index: true },
    statusCode: { type: Number, index: true },
    severity: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true 
    }
  },
  
  resolution: {
    resolved: { type: Boolean, default: false, index: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String }
  },
  
  metadata: {
    retryCount: { type: Number, default: 0 },
    tags: [String],
    customData: { type: mongoose.Schema.Types.Mixed }
  }
}, { 
  timestamps: true 
});

// Create indexes for efficient querying
errorLogSchema.index({ createdAt: -1 });
errorLogSchema.index({ 'context.severity': 1, createdAt: -1 });
errorLogSchema.index({ resolved: 1, createdAt: -1 });
errorLogSchema.index({ 'user.userId': 1, createdAt: -1 });

const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);

module.exports = ErrorLog;