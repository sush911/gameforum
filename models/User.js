const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  role: { type: String, enum: ['User', 'Admin'], default: 'User' },

  balance: { type: Number, default: 1000 }, // sandbox credits

  mfa_enabled: { type: Boolean, default: false },
  mfa_otp: String,
  mfa_expires: Date,

  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
