const { body, validationResult } = require('express-validator');
const { sanitizeText, sanitizeEmail, sanitizeUsername, sanitizeURL } = require('../utils/sanitize');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      msg: 'validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// Registration validation rules
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('username must be 3-30 chars')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('username can only have letters numbers underscore')
    .customSanitizer(value => sanitizeUsername(value)),
  
  body('email')
    .trim()
    .isEmail().withMessage('invalid email')
    .normalizeEmail()
    .customSanitizer(value => sanitizeEmail(value)),
  
  body('password')
    .isLength({ min: 8 }).withMessage('password must be 8+ chars')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/).withMessage('password needs uppercase lowercase number special char'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password).withMessage('passwords dont match'),
  
  validate
];

// Login validation rules
const validateLogin = [
  body('email')
    .trim()
    .isEmail().withMessage('invalid email')
    .normalizeEmail()
    .customSanitizer(value => sanitizeEmail(value)),
  
  body('password')
    .notEmpty().withMessage('password required'),
  
  validate
];

// Post creation validation
const validatePost = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('title must be 5-200 chars')
    .customSanitizer(value => sanitizeText(value)),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('content must be 10-5000 chars')
    .customSanitizer(value => sanitizeText(value)),
  
  validate
];

// Comment validation
const validateComment = [
  body('content')
    .trim()
    .isLength({ min: 2, max: 1000 }).withMessage('comment must be 2-1000 chars')
    .customSanitizer(value => sanitizeText(value)),
  
  body('postId')
    .notEmpty().withMessage('post id required')
    .isMongoId().withMessage('invalid post id'),
  
  validate
];

// Profile update validation
const validateProfile = [
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('bio too long (max 500)')
    .customSanitizer(value => sanitizeText(value)),
  
  body('avatar')
    .optional()
    .trim()
    .customSanitizer(value => sanitizeURL(value)),
  
  body('profilePrivate')
    .optional()
    .isBoolean().withMessage('profilePrivate must be boolean'),
  
  validate
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty().withMessage('current password required'),
  
  body('newPassword')
    .isLength({ min: 8 }).withMessage('new password must be 8+ chars')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/).withMessage('password needs uppercase lowercase number special char'),
  
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.newPassword).withMessage('passwords dont match'),
  
  validate
];

module.exports = {
  validate,
  validateRegistration,
  validateLogin,
  validatePost,
  validateComment,
  validateProfile,
  validatePasswordChange
};
