const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },

  password: {
    type: String,
    required: true
  },

  // Store last 3 password hashes to prevent reuse
  passwordHistory: {
    type: [String],
    default: []
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

  lockUntil: {
    type: Date
  },

  mfa_enabled: {
    type: Boolean,
    default: false
  },

  mfa_otp: String,
  mfa_expires: Date

}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
