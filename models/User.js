const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'User' },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,

    mfa_enabled: { type: Boolean, default: false },
    mfa_otp: String,
    mfa_expires: Date,

    isPremium: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
