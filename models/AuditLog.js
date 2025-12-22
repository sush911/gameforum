const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  metadata: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  ip: { type: String, default: null }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
