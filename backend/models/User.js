const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['User', 'Moderator', 'Admin'], default: 'User' },

    // Brute force protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    // MFA
    mfa_enabled: { type: Boolean, default: false },
    mfa_secret: String,
    mfa_backup_codes: [String],

    // Password history & expiry
    passwordHistory: [{ password: String, changedAt: Date }],
    passwordExpiresAt: Date,
    lastPasswordChange: Date,

    // Password reset tokens
    resetToken: String,
    resetTokenExpires: Date,

    // Account settings
    isPremium: { type: Boolean, default: false },
    lastLogin: Date,
    lastLoginIP: String,
    sessionToken: String,
    sessionExpiresAt: Date,

    // Profile data
    bio: String,
    avatar: String,
    profilePrivate: { type: Boolean, default: false },

    // Account status
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },

    // Security settings
    twoFactorRequired: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
