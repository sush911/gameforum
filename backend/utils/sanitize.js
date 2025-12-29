const validator = require('validator');

// Sanitize text input to prevent XSS
const sanitizeText = (text) => {
  if (!text) return '';
  
  // Remove HTML tags and escape special characters
  let sanitized = validator.escape(text.toString());
  
  // Remove any script tags that might have slipped through
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized.trim();
};

// Sanitize HTML but allow safe tags
const sanitizeHTML = (html) => {
  if (!html) return '';
  
  // For now, just escape everything - in production you'd use a library like DOMPurify
  return validator.escape(html.toString()).trim();
};

// Sanitize URL
const sanitizeURL = (url) => {
  if (!url) return '';
  
  // Check if it's a valid URL
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    return '';
  }
  
  // Prevent javascript: and data: URLs
  if (url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:')) {
    return '';
  }
  
  return url.trim();
};

// Sanitize email
const sanitizeEmail = (email) => {
  if (!email) return '';
  return validator.normalizeEmail(email) || '';
};

// Sanitize username (alphanumeric + underscore only)
const sanitizeUsername = (username) => {
  if (!username) return '';
  return username.replace(/[^a-zA-Z0-9_]/g, '').trim();
};

// Sanitize object - recursively sanitize all string values
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeText(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

module.exports = {
  sanitizeText,
  sanitizeHTML,
  sanitizeURL,
  sanitizeEmail,
  sanitizeUsername,
  sanitizeObject
};
