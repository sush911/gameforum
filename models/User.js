// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['User', 'Admin'], default: 'User' },
    
    // MFA
    mfa_enabled: { type: Boolean, default: false },
    mfa_otp: { type: String },
    mfa_expires: { type: Date },

    // Login attempts
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
