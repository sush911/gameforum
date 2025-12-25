const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

const {
  isValidUsername,
  isValidEmail,
  isStrongPassword,
  checkPasswordReuse,
  isAccountLocked,
  isPasswordExpired,
  getPasswordExpiryDate,
  generateSessionToken,
  getSessionExpiryTime,
  sanitizeUser,
  generateResetToken,
  getResetTokenExpiry,
  sanitizeInput
} = require('../utils/security');

// Email configuration (use environment variables)
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Log user action
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      metadata,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// ==================== USER PROFILE ROUTES ====================

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, avatar, profilePrivate } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Validate inputs
    if (bio && bio.length > 500) {
      return res.status(400).json({ msg: 'Bio must be less than 500 characters' });
    }

    if (avatar && !isValidUrl(avatar)) {
      return res.status(400).json({ msg: 'Invalid avatar URL' });
    }

    user.bio = bio || user.bio;
    user.avatar = avatar || user.avatar;
    user.profilePrivate = profilePrivate !== undefined ? profilePrivate : user.profilePrivate;

    await user.save();
    await logAction(user._id, 'PROFILE_UPDATED', { fields: ['bio', 'avatar', 'profilePrivate'] });

    res.json({
      msg: 'Profile updated successfully',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to update profile' });
  }
});

// ==================== PASSWORD MANAGEMENT ====================

// Request password reset
router.post('/password/reset-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'Invalid email address' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists in system
      return res.json({ msg: 'If email exists, reset link will be sent' });
    }

    const resetToken = generateResetToken();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    user.resetToken = resetTokenHash;
    user.resetTokenExpires = getResetTokenExpiry();
    await user.save();

    // Send email with reset link
    const resetLink = `${process.env.FRONTEND_URL}/password-reset?token=${resetToken}&email=${email}`;
    
    await emailTransporter.sendMail({
      to: email,
      subject: 'Password Reset Request - Game Forum',
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`
    });

    await logAction(user._id, 'PASSWORD_RESET_REQUESTED', { email });

    res.json({ msg: 'Reset link sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to process reset request' });
  }
});

// Reset password
router.post('/password/reset', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'Invalid email' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify reset token
    const tokenValid = await bcrypt.compare(token, user.resetToken);
    if (!tokenValid || new Date() > new Date(user.resetTokenExpires)) {
      return res.status(400).json({ msg: 'Invalid or expired reset token' });
    }

    // Check password reuse
    const reused = await checkPasswordReuse(user, newPassword, bcrypt);
    if (reused) {
      return res.status(400).json({ msg: 'Cannot reuse recent passwords' });
    }

    // Update password
    const newHash = await bcrypt.hash(newPassword, 12);
    if (!user.passwordHistory) user.passwordHistory = [];
    user.passwordHistory.push({ password: newHash, changedAt: new Date() });
    if (user.passwordHistory.length > 10) user.passwordHistory.shift();

    user.password = newHash;
    user.passwordExpiresAt = getPasswordExpiryDate();
    user.lastPasswordChange = new Date();
    user.resetToken = null;
    user.resetTokenExpires = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();
    await logAction(user._id, 'PASSWORD_RESET_COMPLETED', {});

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to reset password' });
  }
});

// ==================== PAYMENT ROUTES ====================

// Create payment intent (Stripe)
router.post('/payments/create-intent', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }

    // Create payment record
    const payment = await Payment.create({
      user: req.user.id,
      amount,
      description,
      paymentMethod: 'stripe',
      status: 'pending'
    });

    await logAction(req.user.id, 'PAYMENT_INITIATED', { amount, paymentId: payment._id });

    res.json({
      msg: 'Payment intent created',
      paymentId: payment._id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/payments/confirm', auth, async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ msg: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Unauthorized' });
    }

    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Upgrade user to premium if applicable
    const user = await User.findById(req.user.id);
    user.isPremium = true;
    await user.save();

    await logAction(req.user.id, 'PAYMENT_COMPLETED', { amount: payment.amount });

    res.json({ msg: 'Payment confirmed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to confirm payment' });
  }
});

// Get payment history
router.get('/payments/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch payment history' });
  }
});

// ==================== ACTIVITY LOG ====================

// Get user activity logs (Admin only)
router.get('/activity-logs/:userId', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find({ user: req.params.userId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch activity logs' });
  }
});

// Get all activity logs (Admin only)
router.get('/activity-logs', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'username email')
      .sort({ timestamp: -1 })
      .limit(500);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch activity logs' });
  }
});

// ==================== HELPER FUNCTIONS ====================

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = router;
