const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  metadata: Object
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
