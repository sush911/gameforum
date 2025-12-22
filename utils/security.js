const validator = require('validator');
const crypto = require('crypto');

// Check if email is valid format
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email);
};

// Check if password meets security requirements
// Must have: 8+ chars, uppercase, lowercase, digit, special char
const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  // Regex: at least 1 lowercase, 1 uppercase, 1 digit, 1 special char, min 8 chars
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
};

// Check password history to prevent reuse
const checkPasswordReuse = async (user, newPassword, bcrypt) => {
  if (!user.passwordHistory || user.passwordHistory.length === 0) return false;
  
  // Check last 5 passwords
  for (let i = 0; i < Math.min(5, user.passwordHistory.length); i++) {
    const match = await bcrypt.compare(newPassword, user.passwordHistory[i].password);
    if (match) return true; // Password was reused
  }
  return false;
};

// Check if account is locked
const isAccountLocked = (user) => {
  if (!user.lockUntil) return false;
  return new Date() < new Date(user.lockUntil);
};

// Check if password has expired (90 days)
const isPasswordExpired = (user) => {
  if (!user.passwordExpiresAt) return false;
  return new Date() > new Date(user.passwordExpiresAt);
};

// Generate password expiry date (90 days from now)
const getPasswordExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date;
};

// Generate session token
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// Get session expiry time (24 hours)
const getSessionExpiryTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
};

// Sanitize user data for response
const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.mfa_secret;
  delete obj.passwordHistory;
  delete obj.sessionToken;
  delete obj.mfa_backup_codes;
  return obj;
};

// Rate limit check helper
const checkRateLimit = (attempts, maxAttempts = 5) => {
  return attempts >= maxAttempts;
};

module.exports = {
  isValidEmail,
  isStrongPassword,
  checkPasswordReuse,
  isAccountLocked,
  isPasswordExpired,
  getPasswordExpiryDate,
  generateSessionToken,
  getSessionExpiryTime,
  sanitizeUser,
  checkRateLimit
};
