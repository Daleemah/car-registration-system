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

// ─── Public-ish routes (authenticated users) ─────────────────────────────────

router.post(
  "/",
  requireAuth,
  validateBody(createRegistrationSchema),
  ctrl.createRegistration
);


router.get("/", requireAuth, ctrl.listRegistrations);
router.get("/:id", requireAuth, ctrl.getRegistration);

router.put(
  "/:id",
  requireAuth,
  validateBody(updateRegistrationSchema),
  ctrl.updateRegistration
);

router.delete("/:id", requireAuth, ctrl.deleteRegistration);
router.post("/:id/submit", requireAuth, ctrl.submitRegistration);
router.post(
  "/:id/payment",
  requireAuth,
  validateBody(paymentSchema),
  ctrl.capturePayment
);

router.post(
  "/:id/renew",
  requireAuth,
  validateBody(renewSchema),
  ctrl.renewRegistration
);

// ─── Admin / Staff only routes ────────────────────────────────────────────────

router.post(
  "/:id/approve",
  requireAuth,
  requireRole("admin", "staff"),
  validateBody(approveSchema),
  ctrl.approveRegistration
);

router.post(
  "/:id/reject",
  requireAuth,
  requireRole("admin", "staff"),
  validateBody(rejectSchema),
  ctrl.rejectRegistration
);

module.exports = router;
