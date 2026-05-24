const mongoose = require('mongoose');

// Central logging collection for all activities across the system
const centralLogSchema = new mongoose.Schema({
  modelName: { type: String, required: true, index: true },  // Changed from 'collection'
  documentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  action: { type: String, required: true, index: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  performedAt: { type: Date, default: Date.now, index: true },
  note: { type: String },
  fromStatus: { type: String },
  toStatus: { type: String },
  metadata: {
    ip: { type: String },
    userAgent: { type: String },
    changes: { type: mongoose.Schema.Types.Mixed },
    additionalData: { type: mongoose.Schema.Types.Mixed }
  }
}, { timestamps: true });

// Create indexes for efficient querying
centralLogSchema.index({ modelName: 1, documentId: 1, performedAt: -1 });  // Updated
centralLogSchema.index({ performedBy: 1, performedAt: -1 });
centralLogSchema.index({ action: 1, performedAt: -1 });
centralLogSchema.index({ modelName: 1, action: 1 });  // Updated

const CentralLog = mongoose.model('CentralLog', centralLogSchema);

/**
 * Activity Logger - works with any model that has an auditLog field
 */
class ActivityLogger {
  /**
   * Log an activity for any document
   */
  static async log(document, action, userId, note, fromStatus = null, toStatus = null, metadata = {}) {
    if (!document) {
      console.warn('Document is null or undefined');
      return;
    }

    // Log to document's auditLog if it exists
    if (document.auditLog) {
      const logEntry = {
        action,
        performedBy: userId,
        performedAt: new Date(),
        note,
        fromStatus: fromStatus || document.status || null,
        toStatus: toStatus || document.status || null,
      };
      document.auditLog.push(logEntry);
      await document.save();
    }
    
    // Also log to central collection for system-wide queries
    try {
      await CentralLog.create({
        modelName: document.constructor?.modelName || 'Unknown',  // Changed from 'collection'
        documentId: document._id,
        action,
        performedBy: userId,
        note,
        fromStatus: fromStatus || document.status || null,
        toStatus: toStatus || document.status || null,
        metadata: {
          ip: metadata.ip || null,
          userAgent: metadata.userAgent || null,
          changes: metadata.changes || null,
          additionalData: metadata.additionalData || null
        }
      });
    } catch (error) {
      console.error('Failed to log to central collection:', error);
    }
  }

  /**
   * Log user-related actions (login, logout, registration)
   */
  static async logUserAction(userId, action, note, metadata = {}) {
    try {
      await CentralLog.create({
        modelName: 'User',  // Changed from 'collection'
        documentId: userId || new mongoose.Types.ObjectId(),
        action,
        performedBy: userId,
        note,
        fromStatus: null,
        toStatus: null,
        metadata: {
          ip: metadata.ip || null,
          userAgent: metadata.userAgent || null,
          additionalData: metadata.additionalData || null
        }
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }

  /**
   * Get activity logs for a document with pagination
   */
  static async getDocumentLogs(documentId, modelName, options = {}) {  // Changed parameter name
    const { limit = 50, skip = 0, action = null } = options;
    
    const query = {
      documentId: mongoose.Types.ObjectId(documentId),
      modelName: modelName  // Changed from 'collection'
    };
    
    if (action) query.action = action;
    
    const logs = await CentralLog.find(query)
      .populate('performedBy', 'fullName email role')
      .sort({ performedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await CentralLog.countDocuments(query);
    
    return {
      total,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < total
      }
    };
  }

  /**
   * Get all activities for a specific user
   */
  static async getUserActivities(userId, options = {}) {
    const { limit = 50, skip = 0, modelName = null, action = null } = options;  // Changed
    
    const query = { performedBy: mongoose.Types.ObjectId(userId) };
    if (modelName) query.modelName = modelName;  // Changed
    if (action) query.action = action;
    
    const logs = await CentralLog.find(query)
      .populate('performedBy', 'fullName email role')
      .sort({ performedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await CentralLog.countDocuments(query);
    
    return {
      total,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < total
      }
    };
  }

  /**
   * Get system-wide activities (admin only)
   */
  static async getAllActivities(options = {}) {
    const { 
      limit = 50, 
      skip = 0, 
      modelName = null,  // Changed
      action = null,
      userId = null,
      startDate = null,
      endDate = null
    } = options;
    
    const query = {};
    if (modelName) query.modelName = modelName;  // Changed
    if (action) query.action = action;
    if (userId) query.performedBy = mongoose.Types.ObjectId(userId);
    
    if (startDate || endDate) {
      query.performedAt = {};
      if (startDate) query.performedAt.$gte = new Date(startDate);
      if (endDate) query.performedAt.$lte = new Date(endDate);
    }
    
    const logs = await CentralLog.find(query)
      .populate('performedBy', 'fullName email role')
      .sort({ performedAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));
    
    const total = await CentralLog.countDocuments(query);
    
    return {
      total,
      logs,
      pagination: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: skip + limit < total
      }
    };
  }

  /**
   * Get login/logout statistics
   */
  static async getUserSessionStats(userId, options = {}) {
    const { startDate = null, endDate = null } = options;
    
    const query = {
      performedBy: mongoose.Types.ObjectId(userId),
      modelName: 'User',  // Changed
      action: { $in: ['login', 'logout'] }
    };
    
    if (startDate || endDate) {
      query.performedAt = {};
      if (startDate) query.performedAt.$gte = new Date(startDate);
      if (endDate) query.performedAt.$lte = new Date(endDate);
    }
    
    const sessions = await CentralLog.find(query).sort({ performedAt: 1 });
    
    // Calculate session durations
    let totalDuration = 0;
    let sessionCount = 0;
    let lastLogin = null;
    
    for (const session of sessions) {
      if (session.action === 'login') {
        lastLogin = session.performedAt;
      } else if (session.action === 'logout' && lastLogin) {
        const duration = (session.performedAt - lastLogin) / 1000 / 60; // in minutes
        totalDuration += duration;
        sessionCount++;
        lastLogin = null;
      }
    }
    
    return {
      totalSessions: sessionCount,
      averageSessionDuration: sessionCount > 0 ? (totalDuration / sessionCount).toFixed(2) : 0,
      totalLoginCount: sessions.filter(s => s.action === 'login').length,
      totalLogoutCount: sessions.filter(s => s.action === 'logout').length
    };
  }
}

module.exports = { ActivityLogger, CentralLog };