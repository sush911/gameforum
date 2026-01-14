const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {String} params.userId - User ID
 * @param {String} params.username - Username
 * @param {String} params.action - Action performed (LOGIN, LOGOUT, POST_CREATE, etc.)
 * @param {String} params.actionType - Type of action (AUTH, POST, COMMENT, USER, ADMIN, OTHER)
 * @param {String} params.ipAddress - IP address
 * @param {String} params.userAgent - User agent string
 * @param {Object} params.metadata - Additional metadata
 * @param {String} params.status - SUCCESS or FAILED
 */
async function logAudit({
  userId,
  username,
  action,
  actionType = 'OTHER',
  ipAddress,
  userAgent,
  metadata = {},
  status = 'SUCCESS'
}) {
  try {
    await AuditLog.create({
      user: userId,
      username,
      action,
      actionType,
      ipAddress,
      userAgent,
      metadata,
      status
    });
    console.log('Audit Log:', action, 'by', username || 'Unknown');
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

// Action types constants
const ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MFA_ENABLE: 'MFA_ENABLE',
  MFA_DISABLE: 'MFA_DISABLE',
  MFA_VERIFIED: 'MFA_VERIFIED',
  EMAIL_OTP_VERIFIED: 'EMAIL_OTP_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  
  // Posts
  POST_CREATE: 'POST_CREATE',
  POST_UPDATE: 'POST_UPDATE',
  POST_DELETE: 'POST_DELETE',
  POST_LIKE: 'POST_LIKE',
  POST_VIEW: 'POST_VIEW',
  
  // Comments
  COMMENT_CREATE: 'COMMENT_CREATE',
  COMMENT_DELETE: 'COMMENT_DELETE',
  COMMENT_LIKE: 'COMMENT_LIKE',
  REPLY_CREATE: 'REPLY_CREATE',
  REPLY_DELETE: 'REPLY_DELETE',
  
  // User Actions
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  AVATAR_UPLOAD: 'AVATAR_UPLOAD',
  
  // Admin Actions
  USER_LOCK: 'USER_LOCK',
  USER_UNLOCK: 'USER_UNLOCK',
  CATEGORY_CREATE: 'CATEGORY_CREATE',
  CATEGORY_UPDATE: 'CATEGORY_UPDATE',
  CATEGORY_DELETE: 'CATEGORY_DELETE',
  
  // Other
  PAYMENT: 'PAYMENT',
  COMMUNITY_JOIN: 'COMMUNITY_JOIN',
  COMMUNITY_LEAVE: 'COMMUNITY_LEAVE'
};

const ACTION_TYPES = {
  AUTH: 'AUTH',
  POST: 'POST',
  COMMENT: 'COMMENT',
  USER: 'USER',
  ADMIN: 'ADMIN',
  OTHER: 'OTHER'
};

module.exports = {
  logAudit,
  ACTIONS,
  ACTION_TYPES
};
