const express = require('express');
const router = express.Router();
const { register, login, getMe, logout, updateProfile, getAllUsers} = require('../controllers/userAuthController');

const { protect, requireRole } = require('../middlewares/authMiddleware');

router.get('/me', protect, getMe);
router.post('/register', register);
router.post('/login', login);
router.put('/profile', protect, updateProfile);

// const logout = (req, res) => {
//   res.status(200).json({ success: true, message: 'Logged out successfully' });
// };

router.post('/logout', protect, logout);
router.get('/all-users', protect, requireRole('admin'), getAllUsers);

module.exports = router;