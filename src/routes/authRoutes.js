const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');

const { protect } = require('../middlewares/auth.middleware');

router.get('/me', protect, getMe);
router.post('/register', register);
router.post('/login', login);

const logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

router.post('/logout', protect, logout);

module.exports = router;