const { Registration, REGISTRATION_STATUS, REVIEW_LEVELS } = require("../models/registrationModel");
const { ApiError } = require("../utils/ApiError");
const { generatePlate } = require("../utils/plate");
const { ActivityLogger } = require("./activityLogService");

// ─── Helper Functions ─────────────────────────────────────────────────────────

function calculateFee(vehicleClass, engineCapacity = 0) {
  const baseFees = {
    motorcycle: 5000,
    private: 15000,
    commercial: 25000,
    heavy_duty: 40000,
    government: 10000,
  };
  let fee = baseFees[vehicleClass] || 15000;
  if (engineCapacity > 2000) fee += 5000;
  if (engineCapacity > 3500) fee += 10000;
  return fee;
}

function calculateExpiry(from = new Date(), years = 1) {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

async function generateUniquePlate(prefix = "AR") {
  let plate;
  let attempts = 0;
  do {
    plate = generatePlate(prefix);
    attempts++;
    if (attempts > 20) throw new ApiError(500, "Could not generate a unique plate number");
  } while (await Registration.findOne({ plateNumber: plate }));
  return plate;
}

// Helper function to add audit log
async function addAuditLog(registration, action, userId, note, fromStatus, toStatus, reviewLevel = null) {
  registration.auditLog.push({
    action,
    performedBy: userId,
    performedAt: new Date(),
    note,
    fromStatus: fromStatus || null,
    toStatus: toStatus || null,
    reviewLevel: reviewLevel || registration.reviewLevel,
  });
  await registration.save();
}

// ─── User Actions ─────────────────────────────────────────────────────────────

async function createRegistration(applicantId, data, metadata = {}) {
  const vin = data.vehicle.vin.toUpperCase();
  const existing = await Registration.findOne({ "vehicle.vin": vin });
  if (existing) throw new ApiError(409, "A registration with this VIN already exists");

  const feeAmount = calculateFee(data.vehicle.vehicleClass, data.vehicle.engineCapacity);

  const reg = new Registration({
    applicantId,
    vehicle: { ...data.vehicle, vin },
    owner: data.owner,
    feeAmount,
    status: "draft",
    reviewLevel: "user",
  });

  await reg.save();
  
  await ActivityLogger.log(
    reg,
    "created",
    applicantId,
    `Draft registration created for ${data.vehicle.make} ${data.vehicle.model}`,
    null,
    "draft",
    { ip: metadata.ip, userAgent: metadata.userAgent }
  );
  
  return reg;
}

async function getRegistrationById(id) {
  const reg = await Registration.findById(id)
    .populate("applicantId", "fullName email")
    .populate("reviewedBy", "fullName email")
    .populate("staffReview.reviewedBy", "fullName email")
    .populate("adminReview.reviewedBy", "fullName email");
  if (!reg) throw new ApiError(404, "Registration not found");
  return reg;
}

async function listRegistrations(filters, userId, userRole, pagination) {
  const query = {};

  // Regular users only see their own records
  if (userRole === "user") query.applicantId = userId;

  if (filters.status) query.status = filters.status;
  if (filters.vehicleClass) query["vehicle.vehicleClass"] = filters.vehicleClass;

  // Search across multiple fields
  if (filters.search) {
    query.$or = [

      {"vehicle.vin": {
        $regex: filters.search,
        $options: "i"
       }
     },

      {
        "vehicle.make": {
          $regex: filters.search,
          $options: "i"
        }
      },

      {
        "vehicle.model": {
          $regex: filters.search,
          $options: "i"
        }
      },

      {
        "plateNumber": {
          $regex: filters.search,
          $options: "i"
        }
      }
    ];
  }
  const totalCount = await Registration.countDocuments(query);
  
  const data = await Registration.find(query)
    .populate("applicantId", "fullName email")
    .populate("staffReview.reviewedBy", "fullName email")
    .populate("adminReview.reviewedBy", "fullName email")
    .sort({ createdAt: -1 })
    .skip(pagination.skip)
    .limit(pagination.limit);
  
  return { data, totalCount };
}

async function updateRegistration(id, applicantId, data, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner of this registration");
  }
  if (reg.status !== "draft") {
    throw new ApiError(400, `Cannot edit a registration in '${reg.status}' status`);
  }

  // Track changes for logging
  const changes = {};
  if (data.vehicle) {
    changes.vehicle = { old: { ...reg.vehicle }, new: data.vehicle };
    Object.assign(reg.vehicle, data.vehicle);
  }
  if (data.owner) {
    changes.owner = { old: { ...reg.owner }, new: data.owner };
    Object.assign(reg.owner, data.owner);
  }

  reg.feeAmount = calculateFee(reg.vehicle.vehicleClass, reg.vehicle.engineCapacity);
  await reg.save();

  await ActivityLogger.log(
    reg,
    "updated",
    applicantId,
    "Registration details updated",
    "draft",
    "draft",
    {
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      changes: changes
    }
  );
  
  return reg;
}

async function deleteRegistration(id, applicantId, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (!["draft", "rejected"].includes(reg.status)) {
    throw new ApiError(400, "Only draft or rejected registrations can be deleted");
  }

  // Log before deletion
  await ActivityLogger.log(
    reg,
    "deleted",
    applicantId,
    `Registration deleted for ${reg.vehicle.make} ${reg.vehicle.model}`,
    reg.status,
    null,
    {
      ip: metadata.ip,
      userAgent: metadata.userAgent
    }
  );

  await reg.deleteOne();
  return { message: "Registration deleted successfully" };
}

async function submitRegistration(id, applicantId, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (reg.status !== "draft") {
    throw new ApiError(400, `Cannot submit registration in '${reg.status}' status`);
  }

  const prev = reg.status;
  reg.status = "submitted";
  reg.reviewLevel = "staff";
  
  await addAuditLog(reg, "submitted", applicantId, 
    `Registration submitted for staff review`, prev, "submitted", "staff");
  
  await reg.save();

  await ActivityLogger.log(
    reg,
    "submitted",
    applicantId,
    `Registration submitted for staff review`,
    prev,
    "submitted",
    { ip: metadata.ip, userAgent: metadata.userAgent }
  );
  
  return reg;
}

// ─── Staff Actions ────────────────────────────────────────────────────────────

async function startStaffReview(id, staffId, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (reg.status !== "submitted") {
    throw new ApiError(400, `Cannot review registration in '${reg.status}' status`);
  }

  const prev = reg.status;
  reg.status = "under_review";
  reg.staffReview = {
    reviewedBy: staffId,
    reviewedAt: new Date(),
  };
  
  await addAuditLog(reg, "started_review", staffId, 
    `Staff started reviewing registration`, prev, "under_review", "staff");
  
  await reg.save();

  await ActivityLogger.log(
    reg,
    "started_review",
    staffId,
    `Staff started reviewing registration`,
    prev,
    "under_review",
    { ip: metadata.ip, userAgent: metadata.userAgent }
  );
  
  return reg;
}

async function staffRecommendApproval(id, staffId, comments, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (reg.status !== "under_review") {
    throw new ApiError(400, `Cannot recommend approval in '${reg.status}' status`);
  }

  const prev = reg.status;
  reg.status = "recommended";
  reg.reviewLevel = "admin";
  reg.staffReview = {
    ...reg.staffReview,
    recommendation: "approve",
    comments: comments,
    reviewedAt: new Date()
  };
  
  await addAuditLog(reg, "staff_recommended", staffId, 
    `Staff recommended approval: ${comments}`, prev, "recommended", "admin");
  
  await reg.save();

  await ActivityLogger.log(
    reg,
    "staff_recommended",
    staffId,
    `Staff recommended approval for registration`,
    prev,
    "recommended",
    { ip: metadata.ip, userAgent: metadata.userAgent, additionalData: { comments } }
  );
  
  return reg;
}

async function staffRequestChanges(id, staffId, comments, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (reg.status !== "under_review") {
    throw new ApiError(400, `Cannot request changes in '${reg.status}' status`);
  }

  const prev = reg.status;
  reg.status = "draft";
  reg.reviewLevel = "user";
  reg.staffReview = {
    ...reg.staffReview,
    recommendation: "needs_changes",
    comments: comments,
    reviewedAt: new Date()
  };
  reg.reviewNotes = comments;
  
  await addAuditLog(reg, "changes_requested", staffId, 
    `Staff requested changes: ${comments}`, prev, "draft", "user");
  
  await reg.save();

  await ActivityLogger.log(
    reg,
    "changes_requested",
    staffId,
    `Staff requested changes to registration`,
    prev,
    "draft",
    { ip: metadata.ip, userAgent: metadata.userAgent, additionalData: { comments } }
  );
  
  return reg;
}

// ─── Admin Actions ────────────────────────────────────────────────────────────

async function adminApproveRegistration(id, adminId, comments, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (reg.status !== "recommended") {
    throw new ApiError(400, `Cannot approve registration in '${reg.status}' status. Must be 'recommended' by staff.`);
  }

  const plateNumber = await generateUniquePlate();
  const now = new Date();
  const prev = reg.status;

  reg.status = "approved";
  reg.reviewLevel = "admin";
  reg.plateNumber = plateNumber;
  reg.adminReview = {
    reviewedBy: adminId,
    reviewedAt: now,
    decision: "approved",
    comments: comments,
    approvedAt: now
  };
  reg.issuedAt = now;
  reg.expiresAt = calculateExpiry(now, 1);
  
  await addAuditLog(reg, "admin_approved", adminId, 
    `Admin approved registration. Plate: ${plateNumber}. Comments: ${comments || "None"}`,
    prev, "approved", "admin");
  
  await reg.save();

  await ActivityLogger.log(
    reg,
    "admin_approved",
    adminId,
    `Admin approved registration and issued plate ${plateNumber}`,
    prev,
    "approved",
    { ip: metadata.ip, userAgent: metadata.userAgent, additionalData: { plateNumber, comments } }
  );
  
  return reg;
}

async function adminRejectRegistration(id, adminId, reason, metadata = {}) {
  if (!reason) throw new ApiError(400, "Rejection reason is required");

  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (!["submitted", "under_review", "recommended"].includes(reg.status)) {
    throw new ApiError(400, `Cannot reject registration in '${reg.status}' status`);
  }

  const prev = reg.status;
  reg.status = "rejected";
  reg.reviewLevel = "admin";
  reg.adminReview = {
    reviewedBy: adminId,
    reviewedAt: new Date(),
    decision: "rejected",
    comments: reason
  };
  reg.rejectionReason = reason;
  
  await addAuditLog(reg, "admin_rejected", adminId, 
    `Admin rejected registration: ${reason}`, prev, "rejected", "admin");
  
  await reg.save();

  await ActivityLogger.log(
    reg,
    "admin_rejected",
    adminId,
    `Admin rejected registration: ${reason}`,
    prev,
    "rejected",
    { ip: metadata.ip, userAgent: metadata.userAgent, additionalData: { reason } }
  );
  
  return reg;
}

// ─── Payment & Renewal Actions ───────────────────────────────────────────────

async function capturePayment(id, applicantId, paymentReference, amount, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (reg.paymentVerified) {
    throw new ApiError(400, "Payment already captured for this registration");
  }
  if (amount < reg.feeAmount) {
    throw new ApiError(400, `Insufficient payment. Required: ₦${reg.feeAmount}, received: ₦${amount}`);
  }

  const dup = await Registration.findOne({ paymentReference });
  if (dup) throw new ApiError(409, "Payment reference already used");

  reg.paymentReference = paymentReference;
  reg.paymentVerified = true;

  await ActivityLogger.log(
    reg,
    "payment_captured",
    applicantId,
    `Payment captured. Ref: ${paymentReference}, Amount: ₦${amount}`,
    reg.status,
    reg.status,
    {
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      additionalData: { paymentReference, amount, feeAmount: reg.feeAmount }
    }
  );
  
  await reg.save();
  return reg;
}

async function renewRegistration(id, applicantId, paymentReference, metadata = {}) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (reg.status !== "approved") {
    throw new ApiError(400, "Only approved registrations can be renewed");
  }

  const dupPayment = await Registration.findOne({ paymentReference });
  if (dupPayment) throw new ApiError(409, "Payment reference already used");

  const prevExpiry = reg.expiresAt || new Date();
  reg.expiresAt = calculateExpiry(prevExpiry, 1);
  reg.renewalCount += 1;
  reg.paymentReference = paymentReference;
  reg.paymentVerified = true;

  await ActivityLogger.log(
    reg,
    "renewed",
    applicantId,
    `Registration renewed. New expiry: ${reg.expiresAt.toISOString()}`,
    "approved",
    "approved",
    {
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      additionalData: { paymentReference, renewalCount: reg.renewalCount, newExpiry: reg.expiresAt }
    }
  );
  
  await reg.save();
  return reg;
}

// ─── Legacy Actions (Backward Compatibility) ─────────────────────────────────

async function approveRegistration(id, officerId, notes, metadata = {}) {
  // This is a legacy function - redirects to appropriate function based on role
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");
  
  // For backward compatibility, if registration is in old status, handle it
  if (reg.status === "submitted") {
    // Staff approval
    return staffRecommendApproval(id, officerId, notes, metadata);
  } else if (reg.status === "recommended") {
    // Admin approval
    return adminApproveRegistration(id, officerId, notes, metadata);
  } else {
    throw new ApiError(400, `Cannot approve registration in '${reg.status}' status`);
  }
}

async function rejectRegistration(id, officerId, reason, metadata = {}) {
  return adminRejectRegistration(id, officerId, reason, metadata);
}

module.exports = {
  // User actions
  createRegistration,
  getRegistrationById,
  listRegistrations,
  updateRegistration,
  deleteRegistration,
  submitRegistration,
  capturePayment,
  renewRegistration,
  
  // Staff actions
  startStaffReview,
  staffRecommendApproval,
  staffRequestChanges,
  
  // Admin actions
  adminApproveRegistration,
  adminRejectRegistration,
  
  // Legacy actions (backward compatibility)
  approveRegistration,
  rejectRegistration,
};