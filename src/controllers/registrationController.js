const { asyncHandler } = require("../utils/asyncHandler");
const registrationService = require("../services/registrationService");
const paginate = require("../utils/paginate");

// ==================== USER METHODS ====================
const createRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.createRegistration(
    req.user._id, 
    req.body,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.status(201).json({ success: true, data: reg });
});

const listRegistrations = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    vehicleClass: req.query.vehicleClass,
  };

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const { skip, limit: perpage } = paginate(page, limit);


  const regs = await registrationService.listRegistrations(
    filters, 
    req.user._id, 
    req.user.role,
    {
      skip,
      limit: perpage,
    }
  );
  res.json({ 
    success: true, 
    count: regs.length, 
    data: regs,
    page,
    limit: perpage,
    total: regs.totalCount,
    totalPages: Math.ceil(regs.totalCount / perpage)
  });
  
});

const getRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.getRegistrationById(req.params.id);
  
  // Check permission
  if (req.user.role === "user" && 
      String(reg.applicantId._id || reg.applicantId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  
  res.json({ success: true, data: reg });
});

const updateRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.updateRegistration(
    req.params.id, 
    req.user._id, 
    req.body,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, data: reg });
});

const deleteRegistration = asyncHandler(async (req, res) => {
  const result = await registrationService.deleteRegistration(
    req.params.id, 
    req.user._id,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, ...result });
});

const submitRegistration = asyncHandler(async (req, res) => {
  const reg = await registrationService.submitRegistration(
    req.params.id, 
    req.user._id,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Registration submitted for staff review", data: reg });
});

const capturePayment = asyncHandler(async (req, res) => {
  const { paymentReference, amount } = req.body;
  const reg = await registrationService.capturePayment(
    req.params.id,
    req.user._id,
    paymentReference,
    amount,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, data: reg });
});

const renewRegistration = asyncHandler(async (req, res) => {
  const { paymentReference } = req.body;
  const reg = await registrationService.renewRegistration(
    req.params.id,
    req.user._id,
    paymentReference,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Registration renewed", data: reg });
});

// ==================== STAFF METHODS ====================
const startStaffReview = asyncHandler(async (req, res) => {
  const reg = await registrationService.startStaffReview(
    req.params.id, 
    req.user._id,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Staff review started", data: reg });
});

const staffRecommendApproval = asyncHandler(async (req, res) => {
  const { comments } = req.body;
  const reg = await registrationService.staffRecommendApproval(
    req.params.id, 
    req.user._id, 
    comments,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Staff recommended approval", data: reg });
});

const staffRequestChanges = asyncHandler(async (req, res) => {
  const { comments } = req.body;
  const reg = await registrationService.staffRequestChanges(
    req.params.id, 
    req.user._id, 
    comments,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Changes requested", data: reg });
});

// ==================== ADMIN METHODS ====================
const adminApproveRegistration = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const reg = await registrationService.adminApproveRegistration(
    req.params.id, 
    req.user._id, 
    notes,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Registration approved by admin", data: reg });
});

const adminRejectRegistration = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reg = await registrationService.adminRejectRegistration(
    req.params.id, 
    req.user._id, 
    reason,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Registration rejected by admin", data: reg });
});

// ==================== LEGACY METHODS (Backward Compatibility) ====================
const approveRegistration = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  // If user is admin, use admin approval; if staff, use staff recommendation
  if (req.user.role === 'admin') {
    const reg = await registrationService.adminApproveRegistration(
      req.params.id, 
      req.user._id, 
      notes,
      { ip: req.ip, userAgent: req.get('user-agent') }
    );
    res.json({ success: true, message: "Registration approved", data: reg });
  } else {
    const reg = await registrationService.staffRecommendApproval(
      req.params.id, 
      req.user._id, 
      notes,
      { ip: req.ip, userAgent: req.get('user-agent') }
    );
    res.json({ success: true, message: "Registration recommended for approval", data: reg });
  }
});

const rejectRegistration = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reg = await registrationService.adminRejectRegistration(
    req.params.id, 
    req.user._id, 
    reason,
    { ip: req.ip, userAgent: req.get('user-agent') }
  );
  res.json({ success: true, message: "Registration rejected", data: reg });
});

module.exports = {
  // User methods
  createRegistration,
  listRegistrations,
  getRegistration,
  updateRegistration,
  deleteRegistration,
  submitRegistration,
  capturePayment,
  renewRegistration,
  
  // Staff methods
  startStaffReview,
  staffRecommendApproval,
  staffRequestChanges,
  
  // Admin methods
  adminApproveRegistration,
  adminRejectRegistration,
  
  // Legacy methods
  approveRegistration,
  rejectRegistration,
};