const validator = require('validator');
const crypto = require('crypto');

// username validation - 3-30 chars, letters numbers and underscore only
const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  return /^[a-zA-Z0-9_]{3,30}$/.test(username);
};

// just check email is valid
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return validator.isEmail(email);
};

// password needs uppercase lowercase number and special char
// min 8 chars to avoid brute force
const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
};

// check if user is trying to reuse old passwords
const checkPasswordReuse = async (user, newPassword, bcrypt) => {
  if (!user.passwordHistory || user.passwordHistory.length === 0) return false;
  
  // check last 5 passwords to prevent reuse
  for (let i = 0; i < Math.min(5, user.passwordHistory.length); i++) {
    const match = await bcrypt.compare(newPassword, user.passwordHistory[i].password);
    if (match) return true;
  }
  return false;
};

// check if account locked due to failed attempts
const isAccountLocked = (user) => {
  if (!user.lockUntil) return false;
  return new Date() < new Date(user.lockUntil);
};

// check if password expired (90 days)
const isPasswordExpired = (user) => {
  if (!user.passwordExpiresAt) return false;
  return new Date() > new Date(user.passwordExpiresAt);
};

// set password to expire 90 days from now
const getPasswordExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date;
};

// generate random session token
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// session expires after 24 hours
const getSessionExpiryTime = () => {
  const date = new Date();
  date.setHours(date.getHours() + 24);
  return date;
};

// remove sensitive fields from user before sending in response
const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.mfa_secret;
  delete obj.passwordHistory;
  delete obj.sessionToken;
  delete obj.mfa_backup_codes;
  delete obj.resetToken;
  delete obj.resetTokenExpires;
  return obj;
};

// simple check if too many attempts
const checkRateLimit = (attempts, maxAttempts = 5) => {
  return attempts >= maxAttempts;
};

// encrypt sensitive data
const encryptSensitiveData = (data, encryptionKey) => {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(String(encryptionKey)).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err.message);
    return null;
  }
};

// decrypt sensitive data
const decryptSensitiveData = (encryptedData, encryptionKey) => {
  try {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.createHash('sha256').update(String(encryptionKey)).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Decryption error:', err.message);
    return null;
  }
};

// generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// get reset token expiry (1 hour)
const getResetTokenExpiry = () => {
  const date = new Date();
  date.setHours(date.getHours() + 1);
  return date;
};

// validate input to prevent injection attacks
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>\"']/g, '');
};

module.exports = {
  isValidUsername,
  isValidEmail,
  isStrongPassword,
  checkPasswordReuse,
  isAccountLocked,
  isPasswordExpired,
  getPasswordExpiryDate,
  generateSessionToken,
  getSessionExpiryTime,
  sanitizeUser,
  checkRateLimit,
  encryptSensitiveData,
  decryptSensitiveData,
  generateResetToken,
  getResetTokenExpiry,
  sanitizeInput
};
