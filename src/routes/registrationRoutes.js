const { Router } = require("express");
const { requireAuth, requireRole } = require("../middlewares/authMiddleware");
const { validateBody } = require("../utils/validate");
const {
  createRegistrationSchema,
  updateRegistrationSchema,
  approveSchema,
  rejectSchema,
  renewSchema,
  paymentSchema,
} = require("../utils/schemas");
const ctrl = require("../controllers/registrationController");

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// USER ROUTES (All authenticated users)
// ─────────────────────────────────────────────────────────────────────────────

// Create a new registration draft
router.post(
  "/", 
  requireAuth, 
  validateBody(createRegistrationSchema), 
  ctrl.createRegistration
);

// List all registrations (with filters)
router.get("/", requireAuth, ctrl.listRegistrations);

// Get a specific registration by ID
router.get("/:id", requireAuth, ctrl.getRegistration);

// Update a draft registration
router.put(
  "/:id", 
  requireAuth, 
  validateBody(updateRegistrationSchema), 
  ctrl.updateRegistration
);

// Delete a draft or rejected registration
router.delete("/:id", requireAuth, ctrl.deleteRegistration);

// Submit registration for staff review
router.post("/:id/submit", requireAuth, ctrl.submitRegistration);

// Capture payment for registration
router.post(
  "/:id/payment", 
  requireAuth, 
  validateBody(paymentSchema), 
  ctrl.capturePayment
);

// Renew an approved registration
router.post(
  "/:id/renew", 
  requireAuth, 
  validateBody(renewSchema), 
  ctrl.renewRegistration
);

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ROUTES (Staff and Admin can access)
// ─────────────────────────────────────────────────────────────────────────────

// Start staff review (moves from "submitted" to "under_review")
router.post(
  "/:id/staff-review", 
  requireAuth, 
  requireRole("staff", "admin"), 
  ctrl.startStaffReview
);

// Staff recommends approval (moves to "recommended" for admin)
router.post(
  "/:id/staff-approve", 
  requireAuth, 
  requireRole("staff", "admin"), 
  ctrl.staffRecommendApproval
);

// Staff requests changes (sends back to user as "draft")
router.post(
  "/:id/staff-changes", 
  requireAuth, 
  requireRole("staff", "admin"), 
  ctrl.staffRequestChanges
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES (Admin only)
// ─────────────────────────────────────────────────────────────────────────────

// Admin final approval (moves from "recommended" to "approved" and generates plate)
router.post(
  "/:id/admin-approve", 
  requireAuth, 
  requireRole("admin"), 
  validateBody(approveSchema),
  ctrl.adminApproveRegistration
);

// Admin rejection (can reject from any status)
router.post(
  "/:id/admin-reject", 
  requireAuth, 
  requireRole("admin"), 
  validateBody(rejectSchema), 
  ctrl.adminRejectRegistration
);

// Legacy approve route (maintained for backward compatibility)
router.post(
  "/:id/approve", 
  requireAuth, 
  requireRole("admin", "staff"), 
  validateBody(approveSchema),
  ctrl.approveRegistration
);

// Legacy reject route (maintained for backward compatibility)
router.post(
  "/:id/reject", 
  requireAuth, 
  requireRole("admin", "staff"), 
  validateBody(rejectSchema),
  ctrl.rejectRegistration
);

module.exports = router;