const { asyncHandler } = require("../utils/asyncHandler");
const registrationService = require("../services/registrationService");

// POST /api/registrations
const createRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.createRegistration(req.user._id, req.body);
  res.status(201).json({ success: true, data: reg });
});

// GET /api/registrations
const listRegistrations = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    vehicleClass: req.query.vehicleClass,
  };
  const regs = await registrationService.listRegistrations(filters, req.user._id, req.user.role);
  res.json({ success: true, count: regs.length, data: regs });
});

// GET /api/registrations/:id
const getRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.getRegistrationById(req.params.id);

  // Users can only view their own; staff/admin can view all
  if (
    req.user.role === "user" &&
    String(reg.applicantId._id || reg.applicantId) !== String(req.user._id)
  ) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  res.json({ success: true, data: reg });
});

// PUT /api/registrations/:id
const updateRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.updateRegistration(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: reg });
});

// DELETE /api/registrations/:id
const deleteRegistration = asyncHandler(async (req, res) => {
  const result = await registrationService.deleteRegistration(req.params.id, req.user._id);
  res.json({ success: true, ...result });
});

// POST /api/registrations/:id/submit
const submitRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.submitRegistration(req.params.id, req.user._id);
  res.json({ success: true, data: reg });
});

// POST /api/registrations/:id/payment
const capturePayment = asyncHandler(async (req, res) => {
  const { paymentReference, amount } = req.body;
  const reg = await registrationService.capturePayment(
    req.params.id,
    req.user._id,
    paymentReference,
    amount
  );
  res.json({ success: true, data: reg });
});

// POST /api/admin/registrations/:id/approve  (admin / staff only)
const approveRegistration = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const reg = await registrationService.approveRegistration(req.params.id, req.user._id, notes);
  res.json({ success: true, message: "Registration approved", data: reg });
});

// POST /api/admin/registrations/:id/reject  (admin / staff only)
const rejectRegistration = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reg = await registrationService.rejectRegistration(req.params.id, req.user._id, reason);
  res.json({ success: true, message: "Registration rejected", data: reg });
});

// POST /api/registrations/:id/renew
const renewRegistration = asyncHandler(async (req, res) => {
  const { paymentReference } = req.body;
  const reg = await registrationService.renewRegistration(
    req.params.id,
    req.user._id,
    paymentReference
  );
  res.json({ success: true, message: "Registration renewed", data: reg });
});

module.exports = {
  createRegistration,
  listRegistrations,
  getRegistration,
  updateRegistration,
  deleteRegistration,
  submitRegistration,
  capturePayment,
  approveRegistration,
  rejectRegistration,
  renewRegistration,
};
