const { Registration } = require("../models/Registration");
const { ApiError } = require("../utils/ApiError");
const { generatePlate } = require("../utils/plate");

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

/**
 * Returns expiry date `years` years from `from`.
 */
function calculateExpiry(from = new Date(), years = 1) {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Generates a plate number that does not already exist in the DB.
 */
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

function audit(registration, action, userId, note, fromStatus, toStatus) {
  registration.auditLog.push({
    action,
    performedBy: userId,
    performedAt: new Date(),
    note,
    fromStatus: fromStatus || null,
    toStatus: toStatus || null,
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function createRegistration(applicantId, data) {
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
  });

  audit(reg, "created", applicantId, "Draft registration created", null, "draft");
  await reg.save();
  return reg;
}

async function getRegistrationById(id) {
  const reg = await Registration.findById(id)
    .populate("applicantId", "fullName email")
    .populate("reviewedBy", "fullName email");
  if (!reg) throw new ApiError(404, "Registration not found");
  return reg;
}

async function listRegistrations(filters, userId, userRole) {
  const query = {};

  // Regular users only see their own records
  if (userRole === "user") query.applicantId = userId;

  if (filters.status) query.status = filters.status;
  if (filters.vehicleClass) query["vehicle.vehicleClass"] = filters.vehicleClass;

  return Registration.find(query)
    .populate("applicantId", "fullName email")
    .sort({ createdAt: -1 });
}

async function updateRegistration(id, applicantId, data) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner of this registration");
  }
  if (reg.status !== "draft") {
    throw new ApiError(400, `Cannot edit a registration in '${reg.status}' status`);
  }

  if (data.vehicle) Object.assign(reg.vehicle, data.vehicle);
  if (data.owner) Object.assign(reg.owner, data.owner);

  reg.feeAmount = calculateFee(reg.vehicle.vehicleClass, reg.vehicle.engineCapacity);
  audit(reg, "updated", applicantId, "Registration details updated", "draft", "draft");
  await reg.save();
  return reg;
}

async function deleteRegistration(id, applicantId) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (!["draft", "rejected"].includes(reg.status)) {
    throw new ApiError(400, "Only draft or rejected registrations can be deleted");
  }

  await reg.deleteOne();
  return { message: "Registration deleted successfully" };
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

async function submitRegistration(id, applicantId) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (reg.status !== "draft") {
    throw new ApiError(400, `Registration is already '${reg.status}'`);
  }

  const prev = reg.status;
  reg.status = "submitted";
  audit(reg, "submitted", applicantId, "Application submitted for review", prev, "submitted");
  await reg.save();
  return reg;
}

async function approveRegistration(id, officerId, notes) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (!["submitted", "in_review"].includes(reg.status)) {
    throw new ApiError(400, `Cannot approve a registration in '${reg.status}' status`);
  }

  const plateNumber = await generateUniquePlate();
  const now = new Date();
  const prev = reg.status;

  reg.status = "approved";
  reg.plateNumber = plateNumber;
  reg.reviewedBy = officerId;
  reg.reviewedAt = now;
  reg.reviewNotes = notes || "";
  reg.issuedAt = now;
  reg.expiresAt = calculateExpiry(now, 1);

  audit(
    reg,
    "approved",
    officerId,
    `Approved. Plate issued: ${plateNumber}. ${notes || ""}`.trim(),
    prev,
    "approved"
  );

  await reg.save();
  return reg;
}

async function rejectRegistration(id, officerId, reason) {
  if (!reason) throw new ApiError(400, "Rejection reason is required");

  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (!["submitted", "in_review"].includes(reg.status)) {
    throw new ApiError(400, `Cannot reject a registration in '${reg.status}' status`);
  }

  const prev = reg.status;
  reg.status = "rejected";
  reg.reviewedBy = officerId;
  reg.reviewedAt = new Date();
  reg.rejectionReason = reason;

  audit(reg, "rejected", officerId, `Rejected: ${reason}`, prev, "rejected");
  await reg.save();
  return reg;
}

async function renewRegistration(id, applicantId, paymentReference) {
  const reg = await Registration.findById(id);
  if (!reg) throw new ApiError(404, "Registration not found");

  if (String(reg.applicantId) !== String(applicantId)) {
    throw new ApiError(403, "Forbidden — not the owner");
  }
  if (reg.status !== "approved") {
    throw new ApiError(400, "Only approved registrations can be renewed");
  }

  // Check for duplicate payment reference
  const dupPayment = await Registration.findOne({ paymentReference });
  if (dupPayment) throw new ApiError(409, "Payment reference already used");

  const prev = reg.expiresAt || new Date();
  reg.expiresAt = calculateExpiry(prev, 1);
  reg.renewalCount += 1;
  reg.paymentReference = paymentReference;
  reg.paymentVerified = true;

  audit(
    reg,
    "renewed",
    applicantId,
    `Registration renewed. New expiry: ${reg.expiresAt.toISOString()}`,
    "approved",
    "approved"
  );

  await reg.save();
  return reg;
}

async function capturePayment(id, applicantId, paymentReference, amount) {
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

  audit(reg, "payment_captured", applicantId, `Payment captured. Ref: ${paymentReference}`, reg.status, reg.status);
  await reg.save();
  return reg;
}

module.exports = {
  createRegistration,
  getRegistrationById,
  listRegistrations,
  updateRegistration,
  deleteRegistration,
  submitRegistration,
  approveRegistration,
  rejectRegistration,
  renewRegistration,
  capturePayment,
};
