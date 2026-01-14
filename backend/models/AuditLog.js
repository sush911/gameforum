const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: { type: String }, // Store username for quick access
    action: { type: String, required: true }, // LOGIN, LOGOUT, POST_CREATE, POST_DELETE, etc.
    actionType: { type: String, enum: ['AUTH', 'POST', 'COMMENT', 'USER', 'ADMIN', 'OTHER'], default: 'OTHER' },
    ipAddress: { type: String },
    userAgent: { type: String },
    metadata: { type: Object }, // Additional data like post ID, title, etc.
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' }
  },
  { timestamps: true }
);

// Index for faster queries
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actionType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
