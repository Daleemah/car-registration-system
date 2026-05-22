const { User } = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ActivityLogger } = require('../services/activityLogService');
const ErrorLogService = require('../services/errorLogService'); 
const paginate = require('../utils/paginate');

// REGISTER
const register = async (req, res) => {
  try {
    console.log(req.body);

    const { fullName, email, password, phone, address, nin, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    // Create user - let schema handle password hashing
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      address,
      nin,
      role: role || "user",
    });

    // Log the registration activity
    await ActivityLogger.logUserAction(
      user._id,
      'register',
      `New user registered: ${fullName} (${email})`,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        additionalData: { 
          email, 
          role: user.role,
          phone 
        }
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    // Log error to database
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'register',
      severity: 'medium',
      statusCode: 500,
      customData: { email: req.body?.email }
    }).catch(console.error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // Log failed attempt
      await ActivityLogger.logUserAction(
        null,
        'login_failed',
        `Failed login attempt for email: ${email}`,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          additionalData: { email, reason: 'User not found' }
        }
      );
      
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      await ActivityLogger.logUserAction(
        user._id,
        'login_failed',
        `Login attempt on deactivated account`,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          additionalData: { email, reason: 'Account deactivated' }
        }
      );
      
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      // Log failed attempt
      await ActivityLogger.logUserAction(
        user._id,
        'login_failed',
        `Failed login attempt - invalid password`,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          additionalData: { email }
        }
      );
      
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log successful login
    await ActivityLogger.logUserAction(
      user._id,
      'login',
      `User logged in: ${user.fullName} (${email})`,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        additionalData: { 
          email, 
          role: user.role
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    console.error("Error details:", error.stack);
    
    // Log error to database (don't await to avoid blocking)
    ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'login',
      severity: error.statusCode === 401 ? 'low' : 'medium',
      statusCode: error.statusCode || 500,
      customData: { email: req.body?.email }
    }).catch(console.error);
    
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// GET ME
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        nin: req.user.nin,
        role: req.user.role,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// LOGOUT
const logout = async (req, res) => {
  try {
    // Log logout action
    if (req.user) {
      await ActivityLogger.logUserAction(
        req.user._id,
        'logout',
        `User logged out`,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          additionalData: { email: req.user.email }
        }
      );
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    
    // Log error to database
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'logout',
      severity: 'low',
      statusCode: 500
    }).catch(console.error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Error during logout' 
    });
  }
};

// UPDATE USER PROFILE
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['fullName', 'phone', 'address', 'nin'];
    const filteredUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Track changes
    const changes = {};
    for (const [key, value] of Object.entries(filteredUpdates)) {
      if (user[key] !== value) {
        changes[key] = { old: user[key], new: value };
        user[key] = value;
      }
    }
    
    await user.save();
    
    // Log profile update
    if (Object.keys(changes).length > 0) {
      await ActivityLogger.log(
        user,
        'profile_updated',
        req.user._id,
        `User profile updated`,
        null,
        null,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          changes: changes
        }
      );
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        nin: user.nin,
        role: user.role
      }
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    
    // Log error to database
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'updateProfile',
      severity: 'medium',
      statusCode: 500
    }).catch(console.error);
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// CHANGE PASSWORD
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and confirmation'
      });
    }

    // Check if new password and confirmation match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      // Log failed attempt
      await ActivityLogger.logUserAction(
        user._id,
        'change_password_failed',
        `Failed password change attempt - incorrect current password`,
        {
          ip: req.ip,
          userAgent: req.get('user-agent'),
          additionalData: { email: user.email }
        }
      );

      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is same as current
    const isSamePassword = await user.matchPassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password cannot be the same as current password'
      });
    }

    // Update password (let schema handle hashing)
    user.password = newPassword;
    await user.save();

    // Log successful password change
    await ActivityLogger.logUserAction(
      user._id,
      'change_password_success',
      `User changed password successfully`,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        additionalData: { email: user.email }
      }
    );

    // Optional: Send email notification about password change
    // await sendPasswordChangeNotification(user.email, user.fullName);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    
    // Log error to database
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'changePassword',
      severity: 'medium',
      statusCode: 500,
      customData: { userId: req.user?._id }
    }).catch(console.error);
    
    res.status(500).json({
      success: false,
      message: 'Server error while changing password'
    });
  }
};

// FORGOT PASSWORD - Request reset token
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email address'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal that user doesn't exist for security reasons
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user (add these fields to user model if needed)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Log password reset request
    await ActivityLogger.logUserAction(
      user._id,
      'forgot_password_requested',
      `User requested password reset`,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        additionalData: { email: user.email }
      }
    );

    // TODO: Send email with reset link
    // const resetUrl = `${process.env.APP_URL}/reset-password/${resetToken}`;
    // await sendPasswordResetEmail(user.email, user.fullName, resetUrl);

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      // Only include token in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'forgotPassword',
      severity: 'medium',
      statusCode: 500
    }).catch(console.error);
    
    res.status(500).json({
      success: false,
      message: 'Server error processing your request'
    });
  }
};

// RESET PASSWORD - Use reset token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Log successful password reset
    await ActivityLogger.logUserAction(
      user._id,
      'reset_password_success',
      `User reset password successfully`,
      {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        additionalData: { email: user.email }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'resetPassword',
      severity: 'medium',
      statusCode: 500
    }).catch(console.error);
    
    res.status(500).json({
      success: false,
      message: 'Server error resetting password'
    });
  }
};

// ADMIN: GET ALL USERS WITH ACTIVITY
const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    
    const { skip, limit: perPage } = paginate(page, limit);

    const users = await User.find({}).select('-password').skip(skip).limit(perPage);
    
    // Get activity stats for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const stats = await ActivityLogger.getUserSessionStats(user._id);
      return {
        ...user.toObject(),
        sessionStats: stats
      };
    }));

    res.status(200).json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);
    
    // Log error to database
    await ErrorLogService.logError(error, req, {
      service: 'auth',
      operation: 'getAllUsers',
      severity: 'medium',
      statusCode: 500
    }).catch(console.error);
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, logout, updateProfile, changePassword, forgotPassword, resetPassword, getAllUsers };