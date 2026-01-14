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

    // MFA - Email OTP
    mfa_enabled: { type: Boolean, default: false },
    mfa_email_otp: String,
    mfa_email_otp_expires: Date,
    mfa_secret: String, // For TOTP backup
    mfa_backup_codes: [String],

    // Password reset via Email OTP
    passwordResetOTP: String,
    passwordResetOTPExpires: Date,

    // Password history & expiry
    passwordHistory: [{ password: String, changedAt: Date }],
    passwordExpiresAt: Date,
    lastPasswordChange: Date,

    // Account settings
    isPremium: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: String,
    bannedAt: Date,
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastLogin: Date,
    lastLoginIP: String,
    sessionToken: String,
    sessionExpiresAt: Date,

    // Profile data
    bio: String,
    avatar: String, // Profile picture URL
    avatarUploadDate: Date,
    profilePrivate: { type: Boolean, default: false },
    joinDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: true },

    // Security settings
    twoFactorRequired: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
