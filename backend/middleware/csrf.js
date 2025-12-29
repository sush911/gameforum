const crypto = require('crypto');

// Generate CSRF token
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF protection middleware (double submit cookie pattern)
const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get token from header
  const tokenFromHeader = req.headers['x-csrf-token'] || req.headers['csrf-token'];
  
  // Get token from cookie
  const tokenFromCookie = req.cookies?.csrfToken;

  // Check if tokens match
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ msg: 'invalid csrf token' });
  }

  next();
};

// Middleware to set CSRF token cookie
const setCSRFToken = (req, res, next) => {
  if (!req.cookies?.csrfToken) {
    const token = generateCSRFToken();
    res.cookie('csrfToken', token, {
      httpOnly: false, // Need to be readable by JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
  }
  next();
};

module.exports = {
  csrfProtection,
  setCSRFToken,
  generateCSRFToken
};
