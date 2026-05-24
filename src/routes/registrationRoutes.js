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
// USER ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Create a new registration draft
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle, owner]
 *             properties:
 *               vehicle: { $ref: '#/components/schemas/VehicleInfo' }
 *               owner:   { $ref: '#/components/schemas/OwnerInfo' }
 *     responses:
 *       201:
 *         description: Draft registration created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/Registration' }
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post("/", requireAuth, validateBody(createRegistrationSchema), ctrl.createRegistration);

/**
 * @swagger
 * /api/registrations:
 *   get:
 *     summary: List registrations (users see own; staff/admin see all)
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, under_review, recommended, approved, rejected, issued]
 *         description: Filter by registration status
 *       - in: query
 *         name: vehicleClass
 *         schema:
 *           type: string
 *           enum: [motorcycle, private, commercial, heavy_duty, government]
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by VIN, plate number, or owner name
 *     responses:
 *       200:
 *         description: Paginated list of registrations
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedMeta'
 *                 - type: object
 *                   properties:
 *                     success: { type: boolean }
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Registration' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get("/", requireAuth, ctrl.listRegistrations);

/**
 * @swagger
 * /api/registrations/{id}:
 *   get:
 *     summary: Get a single registration by ID
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Registration details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:    { $ref: '#/components/schemas/Registration' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", requireAuth, ctrl.getRegistration);

/**
 * @swagger
 * /api/registrations/{id}:
 *   put:
 *     summary: Update a draft registration
 *     description: Only registrations in `draft` status can be updated.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vehicle:
 *                 type: object
 *                 properties:
 *                   color: { type: string, example: White }
 *                   engineCapacity: { type: number, example: 2500 }
 *               owner:
 *                 type: object
 *                 properties:
 *                   phone: { type: string, example: "08099999999" }
 *     responses:
 *       200:
 *         description: Updated registration
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.put("/:id", requireAuth, validateBody(updateRegistrationSchema), ctrl.updateRegistration);

/**
 * @swagger
 * /api/registrations/{id}:
 *   delete:
 *     summary: Delete a draft or rejected registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Registration deleted
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", requireAuth, ctrl.deleteRegistration);

/**
 * @swagger
 * /api/registrations/{id}/submit:
 *   post:
 *     summary: Submit a draft registration for staff review
 *     description: Moves status from `draft` → `submitted`.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Registration submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string, example: Registration submitted for staff review }
 *                 data:    { $ref: '#/components/schemas/Registration' }
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/submit", requireAuth, ctrl.submitRegistration);

/**
 * @swagger
 * /api/registrations/{id}/payment:
 *   post:
 *     summary: Capture a payment for a registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentReference, amount]
 *             properties:
 *               paymentReference: { type: string, example: PAY-ABC123 }
 *               amount:           { type: number, example: 15000 }
 *     responses:
 *       200:
 *         description: Payment captured
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/:id/payment", requireAuth, validateBody(paymentSchema), ctrl.capturePayment);

/**
 * @swagger
 * /api/registrations/{id}/renew:
 *   post:
 *     summary: Renew an approved registration
 *     description: Only works on `approved` registrations that are near or past their expiry date.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentReference]
 *             properties:
 *               paymentReference: { type: string, example: RENEW-XYZ789 }
 *     responses:
 *       200:
 *         description: Registration renewed
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post("/:id/renew", requireAuth, validateBody(renewSchema), ctrl.renewRegistration);

// ─────────────────────────────────────────────────────────────────────────────
// STAFF ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/registrations/{id}/staff-review:
 *   post:
 *     summary: Begin staff review of a submitted registration
 *     description: Moves status from `submitted` → `under_review`. Requires staff or admin role.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Review started
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/staff-review", requireAuth, requireRole("staff", "admin"), ctrl.startStaffReview);

/**
 * @swagger
 * /api/registrations/{id}/staff-approve:
 *   post:
 *     summary: Staff recommends a registration for admin approval
 *     description: Moves status from `under_review` → `recommended`. Requires staff or admin role.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments: { type: string, example: All documents verified and match records }
 *     responses:
 *       200:
 *         description: Recommendation recorded
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/staff-approve", requireAuth, requireRole("staff", "admin"), ctrl.staffRecommendApproval);

/**
 * @swagger
 * /api/registrations/{id}/staff-changes:
 *   post:
 *     summary: Staff requests changes from the applicant
 *     description: Moves status back to `draft`. Requires staff or admin role.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments: { type: string, example: Please provide a clearer image of your ID }
 *     responses:
 *       200:
 *         description: Changes requested — status reverted to draft
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/staff-changes", requireAuth, requireRole("staff", "admin"), ctrl.staffRequestChanges);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/registrations/{id}/admin-approve:
 *   post:
 *     summary: Admin final approval — issues plate number
 *     description: Moves status from `recommended` → `approved` and generates a plate number. Admin only.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string, example: Approved after full verification }
 *     responses:
 *       200:
 *         description: Registration approved and plate number issued
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/admin-approve", requireAuth, requireRole("admin"), validateBody(approveSchema), ctrl.adminApproveRegistration);

/**
 * @swagger
 * /api/registrations/{id}/admin-reject:
 *   post:
 *     summary: Admin rejects a registration (any status)
 *     description: Moves status to `rejected`. Admin only.
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, minLength: 5, example: VIN does not match chassis number }
 *     responses:
 *       200:
 *         description: Registration rejected
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/admin-reject", requireAuth, requireRole("admin"), validateBody(rejectSchema), ctrl.adminRejectRegistration);

/**
 * @swagger
 * /api/registrations/{id}/approve:
 *   post:
 *     summary: Legacy approve route (admin → approves; staff → recommends)
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Approved or recommended depending on caller's role
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/approve", requireAuth, requireRole("admin", "staff"), validateBody(approveSchema), ctrl.approveRegistration);

/**
 * @swagger
 * /api/registrations/{id}/reject:
 *   post:
 *     summary: Legacy reject route
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string, minLength: 5 }
 *     responses:
 *       200:
 *         description: Registration rejected
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post("/:id/reject", requireAuth, requireRole("admin", "staff"), validateBody(rejectSchema), ctrl.rejectRegistration);

module.exports = router;
