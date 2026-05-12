const mongoose = require("mongoose");

const REGISTRATION_STATUS = [
  "draft",
  "submitted",
  "in_review",
  "approved",
  "rejected",
  "issued",
];

const VEHICLE_CLASSES = [
  "motorcycle",
  "private",
  "commercial",
  "heavy_duty",
  "government",
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
      vin: { type: String, required: true, uppercase: true, trim: true },
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
    plateNumber: {
      type: String,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    feeAmount: { type: Number, default: 0 },
    paymentReference: { type: String, sparse: true, unique: true },
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
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    reviewNotes: { type: String },
    auditLog: [
      {
        action: { type: String },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        performedAt: { type: Date, default: Date.now },
        note: { type: String },
        fromStatus: { type: String },
        toStatus: { type: String },
      },
    ],
  },
  { timestamps: true }
);

registrationSchema.index({ "vehicle.vin": 1 }, { unique: true });

module.exports = {
  Registration: mongoose.model("Registration", registrationSchema),
  REGISTRATION_STATUS,
  VEHICLE_CLASSES,
};
