const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ['User', 'Moderator', 'Admin'],
      default: 'User'
    },

    failedLoginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    // 🔐 MFA fields
    mfa_enabled: {
      type: Boolean,
      default: false
    },
    mfa_otp: {
      type: String,
      default: null
    },
    mfa_expires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
