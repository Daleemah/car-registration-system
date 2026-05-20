const mongoose = require("mongoose");

// Define constants FIRST before using them
const VEHICLE_CLASSES = [
  "motorcycle",
  "private", 
  "commercial",
  "heavy_duty",
  "government"
];

const REGISTRATION_STATUS = [
  "draft",           // User creating/editing
  "submitted",       // User submitted for review
  "under_review",    // Staff is reviewing
  "recommended",     // Staff recommends approval
  "approved",        // Admin approved
  "rejected",        // Admin rejected
  "issued"           // Plate issued (final)
];

const REVIEW_LEVELS = [
  "user",     // Initial submission
  "staff",    // Staff review level
  "admin"     // Admin approval level
];

const registrationSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    vehicle: {
      vin: { 
        type: String, 
        required: true, 
        uppercase: true, 
        trim: true
      },
      make: { type: String, required: true, trim: true },
      model: { type: String, required: true, trim: true },
      year: { type: Number, required: true },
      color: { type: String, required: true, trim: true },
      engineCapacity: { type: Number, default: 0 },
      vehicleClass: { type: String, enum: VEHICLE_CLASSES, required: true },
      chassisNumber: { type: String, trim: true },
    },
    owner: {
      fullName: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
      nationalId: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: REGISTRATION_STATUS,
      default: "draft",
      index: true,
    },
    
    // Multi-level review tracking
    reviewLevel: {
      type: String,
      enum: REVIEW_LEVELS,
      default: "user",
    },
    
    // Staff review
    staffReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      recommendation: { type: String, enum: ["approve", "reject", "needs_changes"] },
      comments: { type: String }
    },
    
    // Admin review/final approval
    adminReview: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: { type: Date },
      decision: { type: String, enum: ["approved", "rejected"] },
      comments: { type: String },
      approvedAt: { type: Date }
    },
    
    plateNumber: {
      type: String,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    feeAmount: { type: Number, default: 0 },
    paymentReference: { 
      type: String, 
      sparse: true, 
      unique: true
    },
    paymentVerified: { type: Boolean, default: false },
    documents: [
      {
        docType: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    renewalCount: { type: Number, default: 0 },
    rejectionReason: { type: String },
    reviewNotes: { type: String },
    
    // Notification tracking for expiry warnings
    notificationSent: {
      type: Map,
      of: new mongoose.Schema({
        sentAt: { type: Date },
        daysBefore: { type: Number }
      }, { _id: false }),
      default: new Map()
    },
    expiryNotified: { type: Boolean, default: false },
    
    auditLog: [
      {
        action: { type: String },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        performedAt: { type: Date, default: Date.now },
        note: { type: String },
        fromStatus: { type: String },
        toStatus: { type: String },
        reviewLevel: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for efficient querying
registrationSchema.index({ "vehicle.vin": 1 }, { unique: true });
registrationSchema.index({ status: 1, reviewLevel: 1 });
registrationSchema.index({ "staffReview.reviewedBy": 1 });
registrationSchema.index({ "adminReview.reviewedBy": 1 });
registrationSchema.index({ expiresAt: 1, status: 1 });
registrationSchema.index({ applicantId: 1, createdAt: -1 });

// Compound index for common query patterns
registrationSchema.index({ status: 1, reviewLevel: 1, createdAt: -1 });

// Text index for search functionality (optional - remove if not needed)
registrationSchema.index({ 
  "vehicle.make": "text", 
  "vehicle.model": "text", 
  "owner.fullName": "text", 
  "owner.email": "text" 
});

module.exports = {
  Registration: mongoose.model("Registration", registrationSchema),
  REGISTRATION_STATUS,
  VEHICLE_CLASSES,
  REVIEW_LEVELS,
};