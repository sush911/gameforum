const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['User', 'Moderator', 'Admin'],
    default: 'User'
  },

  failedLoginAttempts: {
    type: Number,
    default: 0
  },

  lockUntil: Date,

  mfa_enabled: {
    type: Boolean,
    default: false
  },

  mfa_otp: String,
  mfa_expires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
