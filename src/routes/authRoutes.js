const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, updateProfile, changePassword, forgotPassword, resetPassword, getAllUsers } = require('../controllers/userAuthController');
const { protect, requireRole } = require('../middlewares/authMiddleware');

// Register a new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Request password reset (sends email with reset link)
router.post('/forgot-password', forgotPassword);

// Reset password using token from email
router.post('/reset-password', resetPassword);

// Get current user profile
router.get('/me', protect, getMe);

// Update user profile
router.put('/profile', protect, updateProfile);

// Change password (requires current password)
router.post('/change-password', protect, changePassword);

// Logout user
router.post('/logout', protect, logout);

// Get all users with activity stats (Admin only)
router.get('/all-users', protect, requireRole('admin'), getAllUsers);

module.exports = router;