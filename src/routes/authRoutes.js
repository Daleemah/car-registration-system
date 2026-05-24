const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, updateProfile, changePassword, forgotPassword, resetPassword, getAllUsers } = require('../controllers/userAuthController');
const { protect, requireRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, phone]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "08012345678"
 *               address:
 *                 type: string
 *                 example: 123 Main Street, Lagos
 *               nin:
 *                 type: string
 *                 example: "12345678901"
 *               role:
 *                 type: string
 *                 enum: [user, staff, admin]
 *                 default: user
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Account created successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:       { type: string }
 *                     fullName: { type: string }
 *                     email:    { type: string }
 *                     role:     { type: string }
 *       400:
 *         description: Missing required fields or email already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive a JWT token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful — copy the token and click Authorize at the top
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 token:   { type: string, example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     description: >
 *       Always returns 200 to avoid revealing whether an email exists.
 *       In development mode the response also includes `resetToken` for testing.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Reset email sent (or silently ignored if email not found)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 message:    { type: string }
 *                 resetToken: { type: string, description: Only present in NODE_ENV=development }
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token from the forgot-password email
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword, confirmPassword]
 *             properties:
 *               token:           { type: string, description: Token from the reset email }
 *               newPassword:     { type: string, minLength: 8, example: newpassword456 }
 *               confirmPassword: { type: string, minLength: 8, example: newpassword456 }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token, or passwords don't match
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/reset-password', resetPassword);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', protect, getMe);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: John Updated }
 *               phone:    { type: string, example: "08099999999" }
 *               address:  { type: string, example: 456 New Road, Abuja }
 *               nin:      { type: string, example: "98765432100" }
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change the current user's password (requires current password)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmNewPassword]
 *             properties:
 *               currentPassword:    { type: string, example: oldpassword123 }
 *               newPassword:        { type: string, minLength: 8, example: newpassword456 }
 *               confirmNewPassword: { type: string, minLength: 8, example: newpassword456 }
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Passwords don't match or same as current
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: Incorrect current password or invalid token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/change-password', protect, changePassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout the current user (logs the event server-side)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/logout', protect, logout);

/**
 * @swagger
 * /api/auth/all-users:
 *   get:
 *     summary: Get all users with their activity stats (Admin only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageQuery'
 *       - $ref: '#/components/parameters/limitQuery'
 *     responses:
 *       200:
 *         description: Paginated list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/all-users', protect, requireRole('admin'), getAllUsers);

module.exports = router;
