const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Database
const connectDB = require('./db');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');
const { logAudit, ACTIONS, ACTION_TYPES } = require('./utils/auditLogger');
const Payment = require('./models/Payment');
const Category = require('./models/Category');

// Middleware
const auth = require('./middleware/auth');
const checkRole = require('./middleware/role');
const { setCSRFToken, csrfProtection } = require('./middleware/csrf');
const {
  validateRegistration,
  validateLogin,
  validatePost,
  validateComment,
  validateProfile,
  validatePasswordChange
} = require('./middleware/validate');
const { uploadImage, uploadVideo, uploadFile } = require('./middleware/upload');

// Utils
const {
  isValidUsername,
  isValidEmail,
  isStrongPassword,
  checkPasswordReuse,
  isAccountLocked,
  isPasswordExpired,
  getPasswordExpiryDate,
  generateSessionToken,
  getSessionExpiryTime,
  sanitizeUser
} = require('./utils/security');
const { sendPasswordResetEmail, sendWelcomeEmail, sendMFAEmail, sendPasswordResetOTP } = require('./utils/email');
const { generateOTP, getOTPExpiration } = require('./utils/otp');

// Square payment client
let squareClient = null;
try {
  if (process.env.SQUARE_ACCESS_TOKEN) {
    const { SquareClient, SquareEnvironment } = require('square');
    
    console.log('Loading Square credentials...');
    console.log('Access Token:', process.env.SQUARE_ACCESS_TOKEN ? 'EXISTS (length: ' + process.env.SQUARE_ACCESS_TOKEN.length + ')' : 'MISSING');
    console.log('Application ID:', process.env.SQUARE_APPLICATION_ID || 'MISSING');
    
    const environment = SquareEnvironment.Sandbox;
    
    squareClient = new SquareClient({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: environment
    });
    
    console.log('Square API configured (SANDBOX)');
  } else {
    console.log('Square API not configured - SQUARE_ACCESS_TOKEN missing in .env');
  }
} catch (err) {
  console.error('Square API initialization failed:', err.message);
  console.error('Stack:', err.stack);
}

const { deletePostFiles } = require('./utils/fileCleanup');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Allow all origins for development
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(setCSRFToken);

// Serve static files with CORS headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Only connect to DB if not in test mode (tests handle their own connection)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: { msg: 'Too many login attempts. Try again in 15 minutes.' },
  skip: (req) => req.user && req.user.role === 'Admin'
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 registrations per 15 minutes
  message: { msg: 'Too many registrations. Try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Enhanced audit logging helper
const logAction = async (userId, action, metadata = {}, req = null) => {
  try {
    const user = await User.findById(userId);
    await logAudit({
      userId,
      username: user?.username || 'Unknown',
      action,
      actionType: getActionType(action),
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('user-agent'),
      metadata,
      status: 'SUCCESS'
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// Helper to determine action type
const getActionType = (action) => {
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('REGISTER') || action.includes('PASSWORD') || action.includes('MFA')) {
    return ACTION_TYPES.AUTH;
  } else if (action.includes('POST')) {
    return ACTION_TYPES.POST;
  } else if (action.includes('COMMENT')) {
    return ACTION_TYPES.COMMENT;
  } else if (action.includes('USER') || action.includes('PROFILE') || action.includes('AVATAR')) {
    return ACTION_TYPES.USER;
  } else if (action.includes('LOCK') || action.includes('CATEGORY')) {
    return ACTION_TYPES.ADMIN;
  }
  return ACTION_TYPES.OTHER;
};

// Health check
app.get('/', (req, res) => res.json({ msg: 'Gaming Forum API' }));

// Debug endpoint - check Square configuration
app.get('/api/debug/square', (req, res) => {
  res.json({
    squareClientExists: !!squareClient,
    accessTokenExists: !!process.env.SQUARE_ACCESS_TOKEN,
    accessTokenLength: process.env.SQUARE_ACCESS_TOKEN ? process.env.SQUARE_ACCESS_TOKEN.length : 0,
    applicationId: process.env.SQUARE_APPLICATION_ID || 'MISSING',
    nodeEnv: process.env.NODE_ENV
  });
});

// Get CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.cookies.csrfToken });
});

// ==================== CATEGORIES ====================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch categories', error: err.message });
  }
});

// Get single category
app.get('/api/categories/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug, isActive: true });
    if (!category) return res.status(404).json({ msg: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch category', error: err.message });
  }
});

// Create category (Admin/Moderator only)
app.post('/api/categories', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const { name, slug, description, icon, color } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ msg: 'Name and slug are required' });
    }

    // Check if slug already exists
    const existing = await Category.findOne({ slug });
    if (existing) {
      return res.status(409).json({ msg: 'Category with this slug already exists' });
    }

    // Set default values - no image uploads, use color-based defaults
    const categoryData = {
      name,
      slug,
      description: description || '',
      icon: icon || '🎮', // Default gaming icon
      color: color || '#667eea',
      image: null, // No avatar image by default
      coverImage: null, // No cover image by default
      isActive: true,
      postCount: 0
    };

    const category = await Category.create(categoryData);

    await logAction(req.user.id, ACTIONS.CATEGORY_CREATE, { categoryId: category._id, name }, req);
    res.status(201).json(category);
  } catch (err) {
    console.error('Category creation error:', err);
    res.status(500).json({ msg: 'Failed to create category', error: err.message });
  }
});

// Update category (Admin/Moderator only)
app.put('/api/categories/:id', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const { name, description, icon, color, image, coverImage, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, icon, color, image, coverImage, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    await logAction(req.user.id, ACTIONS.CATEGORY_UPDATE, { categoryId: category._id }, req);
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to update category', error: err.message });
  }
});

// Delete category (Admin only)
app.delete('/api/categories/:id', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    // Update post count for all posts in this category
    await Post.updateMany({ category: req.params.id }, { $unset: { category: "" } });

    await logAction(req.user.id, ACTIONS.CATEGORY_DELETE, { categoryId: category._id, name: category.name }, req);
    res.json({ msg: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to delete category', error: err.message });
  }
});

// Join community
app.post('/api/categories/:id/join', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    if (!category.members) {
      category.members = [];
    }

    const isMember = category.members.includes(req.user.id);
    if (isMember) {
      return res.status(400).json({ msg: 'Already a member' });
    }

    category.members.push(req.user.id);
    await category.save();

    res.json({ msg: 'Joined community', memberCount: category.members.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to join community', error: err.message });
  }
});

// Leave community
app.post('/api/categories/:id/leave', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    if (!category.members) {
      category.members = [];
    }

    category.members = category.members.filter(id => id.toString() !== req.user.id);
    await category.save();

    res.json({ msg: 'Left community', memberCount: category.members.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to leave community', error: err.message });
  }
});

// ==================== USER AUTHENTICATION ====================

// Register endpoint
app.post('/api/users/register', registerLimiter, validateRegistration, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // validate input
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ msg: 'All fields (username, email, password, confirmPassword) are required' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ msg: 'Username must be 3-30 characters with letters, numbers, or underscores' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'Please enter a valid email address' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters with: uppercase letter, lowercase letter, number, and special character (!@#$%^&*)'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: 'Passwords do not match' });
    }

    // check user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ msg: 'Email or username already in use' });
    }

    // AUTO-ADMIN: Check if email should get admin privileges
    const adminEmails = ['imnumba1@gmail.com', 'sushantshrestha91133@gmail.com'];
    const userRole = adminEmails.includes(email.toLowerCase()) ? 'Admin' : 'User';

    // hash and create
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      password: hash,
      role: userRole,
      passwordHistory: [{ password: hash, changedAt: new Date() }],
      passwordExpiresAt: getPasswordExpiryDate(),
      lastPasswordChange: new Date()
    });

    if (userRole === 'Admin') {
      console.log('Auto-granted Admin role to new user:', email);
    }

    await logAction(user._id, ACTIONS.REGISTER, { email, username, role: userRole }, req);

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(email, username).catch(err => 
      console.error('Welcome email failed:', err.message)
    );

    res.status(201).json({
      msg: 'Registration successful! Please login.',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'register failed' });
  }
});

// Login endpoint
app.post('/api/users/login', loginLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('LOGIN ATTEMPT:', email);

    // basic validation
    if (!email || !password) {
      console.log('LOGIN FAILED: Missing email/username or password');
      return res.status(400).json({ msg: 'email/username and password needed' });
    }

    // find user by email or username
    let user;
    if (email.includes('@')) {
      user = await User.findOne({ email });
    } else {
      user = await User.findOne({ username: email });
    }
    
    if (!user) {
      console.log('LOGIN FAILED: User not found');
      return res.status(401).json({ msg: 'wrong email/username or password' });
    }
    console.log('User found:', user.email, '| Role:', user.role);

    // AUTO-ADMIN: Grant admin privileges to specific emails
    const adminEmails = ['imnumba1@gmail.com', 'sushantshrestha91133@gmail.com'];
    if (adminEmails.includes(email.toLowerCase()) && user.role !== 'Admin') {
      user.role = 'Admin';
      await user.save();
      console.log('Auto-granted Admin role to:', email);
    }

    // check if banned
    if (user.isBanned) {
      console.log('LOGIN FAILED: User is banned');
      return res.status(403).json({ 
        msg: 'Your account has been banned. Reason: ' + (user.banReason || 'Violation of terms'),
        banned: true
      });
    }

    // check if locked
    if (isAccountLocked(user)) {
      const minutesLeft = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
      console.log('LOGIN FAILED: Account locked for', minutesLeft, 'minutes');
      return res.status(401).json({
        msg: `account locked, try again in ${minutesLeft} mins`
      });
    }

    // check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      console.log('LOGIN FAILED: Invalid password | Failed attempts:', user.failedLoginAttempts);
      
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await logAction(user._id, ACTIONS.ACCOUNT_LOCKED, { reason: 'too many tries' }, req);
        console.log('Account locked due to too many failed attempts');
      }
      
      await user.save();
      return res.status(401).json({ msg: 'wrong email or password' });
    }
    console.log('Password valid');

    // check password expired
    const expired = isPasswordExpired(user);
    console.log('Password expiry check:', expired, '| passwordExpiresAt:', user.passwordExpiresAt);
    if (expired) {
      console.log('LOGIN FAILED: Password expired');
      return res.status(403).json({ msg: 'password expired, reset it' });
    }

    // reset failed tries
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();
    console.log('Reset failed login attempts');

    // check mfa
    if (user.mfa_enabled) {
      console.log('MFA required for', email);
      
      // Generate and send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.mfa_email_otp = otp;
      user.mfa_email_otp_expires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      
      // Send OTP email
      try {
        await sendMFAEmail(email, otp, user.username);
        console.log('MFA OTP sent to:', email, '| OTP:', otp);
      } catch (emailErr) {
        console.error('Failed to send MFA email:', emailErr.message);
        console.log('DEV MODE - OTP for testing:', otp);
      }
      
      return res.status(200).json({
        msg: 'need mfa',
        requireMFA: true,
        tempUserId: user._id
      });
    }

    // create token
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('JWT token created:', token.substring(0, 20) + '...');

    user.sessionToken = generateSessionToken();
    user.sessionExpiresAt = getSessionExpiryTime();
    await user.save();

    await logAction(user._id, ACTIONS.LOGIN, { ip: req.ip, email: user.email }, req);

    // Set secure HTTP-only cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log('LOGIN SUCCESS:', email);
    res.json({
      msg: 'login ok',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    res.status(500).json({ msg: 'login error' });
  }
});

// ==================== MFA SETUP & VERIFICATION ====================

// Setup MFA (TOTP)
app.post('/api/users/mfa/setup', auth, async (req, res) => {
  try {
    const user = req.userDoc;

    // generate secret for authenticator app
    const secret = speakeasy.generateSecret({
      name: `GameForum (${user.email})`,
      issuer: 'GameForum',
      length: 32
    });

    // make qr code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    // backup codes in case u lose authenticator
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    res.json({
      msg: 'mfa ready',
      secret: secret.base32,
      qrCode,
      backupCodes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'mfa setup failed' });
  }
});

// Enable MFA (Email OTP)
app.post('/api/users/mfa/enable', auth, async (req, res) => {
  try {
    const user = req.userDoc;

    // Generate OTP
    const otp = generateOTP(6);
    
    // Save OTP with 30-minute expiry
    user.mfa_email_otp = otp;
    user.mfa_email_otp_expires = getOTPExpiration(30);
    user.mfa_enabled = true; // Enable MFA
    await user.save();

    // Send OTP email
    sendMFAEmail(user.email, otp, user.username).catch(err => {
      console.error('MFA email send failed:', err.message);
    });

    await logAction(user._id, ACTIONS.MFA_ENABLE, {}, req);

    res.json({ 
      msg: 'MFA enabled! OTP sent to your email.',
      email: user.email
    });
  } catch (err) {
    console.error('MFA enable error:', err);
    res.status(500).json({ msg: 'Failed to enable MFA', error: err.message });
  }
});

// Disable MFA
app.post('/api/users/mfa/disable', auth, async (req, res) => {
  try {
    const user = req.userDoc;

    user.mfa_enabled = false;
    user.mfa_email_otp = undefined;
    user.mfa_email_otp_expires = undefined;
    user.mfa_secret = undefined;
    user.mfa_backup_codes = [];
    await user.save();

    await logAction(user._id, ACTIONS.MFA_DISABLE, {}, req);

    res.json({ msg: 'MFA disabled successfully' });
  } catch (err) {
    console.error('MFA disable error:', err);
    res.status(500).json({ msg: 'Failed to disable MFA', error: err.message });
  }
});

// Verify MFA token during login
app.post('/api/users/mfa/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ msg: 'Missing userId or token' });
    }

    const user = await User.findById(userId);
    if (!user || !user.mfa_enabled) {
      return res.status(400).json({ msg: 'MFA not enabled' });
    }

    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: String(token),
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ msg: 'Invalid MFA token' });
    }

    // Create JWT token
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    user.sessionToken = generateSessionToken();
    user.sessionExpiresAt = getSessionExpiryTime();
    await user.save();

    await logAction(user._id, ACTIONS.MFA_VERIFIED, {}, req);

    res.json({
      msg: 'MFA verification successful',
      token: jwtToken,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'MFA verification failed' });
  }
});

// ==================== EMAIL OTP MFA ====================

// Send MFA OTP via email
app.post('/api/users/mfa/send-email-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP(6);
    
    // Save OTP with 10-minute expiry
    user.mfa_email_otp = otp;
    user.mfa_email_otp_expires = getOTPExpiration(10);
    await user.save();

    // Send OTP email
    await sendMFAEmail(email, otp, user.username);

    res.json({ msg: 'MFA code sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to send MFA code' });
  }
});

// Verify email OTP MFA
app.post('/api/users/mfa/verify-email-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    console.log('MFA VERIFICATION ATTEMPT | userId:', userId, '| otp:', otp);

    if (!userId || !otp) {
      console.log('MFA VERIFICATION FAILED: Missing userId or OTP');
      return res.status(400).json({ msg: 'Missing userId or OTP' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('MFA VERIFICATION FAILED: User not found');
      return res.status(404).json({ msg: 'User not found' });
    }
    console.log('User found:', user.email);

    // Verify OTP
    if (!user.mfa_email_otp || user.mfa_email_otp !== otp) {
      console.log('MFA VERIFICATION FAILED: Invalid OTP | Expected:', user.mfa_email_otp, '| Received:', otp);
      return res.status(400).json({ msg: 'Invalid OTP' });
    }
    console.log('OTP matches');

    // Check OTP expiration
    if (!user.mfa_email_otp_expires || user.mfa_email_otp_expires < new Date()) {
      console.log('MFA VERIFICATION FAILED: OTP expired');
      return res.status(400).json({ msg: 'OTP expired. Request a new one.' });
    }
    console.log('OTP not expired');

    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('JWT token created:', jwtToken.substring(0, 20) + '...');

    // Update session
    user.sessionToken = jwtToken;
    user.sessionExpiresAt = getSessionExpiryTime();
    user.mfa_email_otp = undefined;
    user.mfa_email_otp_expires = undefined;
    await user.save();

    await logAction(user._id, ACTIONS.EMAIL_OTP_VERIFIED, {}, req);

    console.log('MFA VERIFICATION SUCCESS:', user.email);
    res.json({
      msg: 'mfa ok',
      token: jwtToken,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('MFA VERIFICATION ERROR:', err);
    res.status(500).json({ msg: 'Email OTP verification failed' });
  }
});

// ==================== PASSWORD MANAGEMENT ====================

// Change password
app.post('/api/users/password/change', auth, validatePasswordChange, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = req.userDoc;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ msg: 'Missing required fields' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ msg: 'Current password incorrect' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ msg: 'New passwords do not match' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        msg: 'password needs uppercase lowercase number special char, 8+ chars'
      });
    }

    // check not reusing old password
    const reused = await checkPasswordReuse(user, newPassword, bcrypt);
    if (reused) {
      return res.status(400).json({
        msg: 'cant reuse old passwords'
      });
    }

    // save password in history
    const newHash = await bcrypt.hash(newPassword, 12);
    if (!user.passwordHistory) user.passwordHistory = [];
    user.passwordHistory.push({ password: newHash, changedAt: new Date() });
    if (user.passwordHistory.length > 10) {
      user.passwordHistory.shift();
    }

    user.password = newHash;
    user.lastPasswordChange = new Date();
    user.passwordExpiresAt = getPasswordExpiryDate();
    await user.save();

    await logAction(user._id, ACTIONS.PASSWORD_CHANGE, {}, req);

    res.json({ msg: 'password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'password change failed' });
  }
});

// Reset password (forgot)
app.post('/api/users/password/reset', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'email needed' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // dont tell if email exists for security
      return res.status(200).json({
        msg: 'check email if it exists'
      });
    }

    // create reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // save it with 1 hour expiry
    user.resetToken = resetTokenHash;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, resetToken, user.username);

    await logAction(user._id, ACTIONS.PASSWORD_RESET, {}, req);

    res.json({
      msg: 'check email for reset link'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'reset failed' });
  }
});

// Confirm password reset with token
app.post('/api/users/password/reset-confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ msg: 'token and new password required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        msg: 'password needs uppercase lowercase number special char, 8+ chars'
      });
    }

    // Hash the token to compare
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'invalid or expired token' });
    }

    // Check not reusing old password
    const reused = await checkPasswordReuse(user, newPassword, bcrypt);
    if (reused) {
      return res.status(400).json({ msg: 'cant reuse old passwords' });
    }

    // Update password
    const newHash = await bcrypt.hash(newPassword, 12);
    if (!user.passwordHistory) user.passwordHistory = [];
    user.passwordHistory.push({ password: newHash, changedAt: new Date() });
    if (user.passwordHistory.length > 10) {
      user.passwordHistory.shift();
    }

    user.password = newHash;
    user.lastPasswordChange = new Date();
    user.passwordExpiresAt = getPasswordExpiryDate();
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    await logAction(user._id, ACTIONS.PASSWORD_RESET, {}, req);

    res.json({ msg: 'password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'reset confirmation failed' });
  }
});

// ==================== PASSWORD RESET VIA EMAIL OTP ====================

// Request password reset OTP
app.post('/api/users/password/reset-otp-request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({ msg: 'If email exists, OTP has been sent' });
    }

    // Generate 6-digit OTP
    const otp = generateOTP(6);
    
    // Save OTP with 30-minute expiry
    user.passwordResetOTP = otp;
    user.passwordResetOTPExpires = getOTPExpiration(30);
    await user.save();

    // Send OTP email (don't wait for it, just log if it fails)
    sendPasswordResetOTP(email, otp, user.username).catch(err => {
      console.error('Email send failed (but OTP saved):', err.message);
    });
    
    await logAction(user._id, 'PASSWORD_RESET_OTP_REQUESTED');

    // Return success (OTP is saved in DB and sent via email)
    res.status(200).json({ 
      msg: 'OTP sent to your email. Please check your inbox.'
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ msg: 'Failed to process password reset request', error: err.message });
  }
});

// Verify OTP and reset password
app.post('/api/users/password/reset-otp-confirm', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ msg: 'Email, OTP, and new password are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        msg: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify OTP
    if (!user.passwordResetOTP || user.passwordResetOTP !== otp) {
      return res.status(400).json({ msg: 'Invalid OTP' });
    }

    // Check OTP expiration
    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < new Date()) {
      return res.status(400).json({ msg: 'OTP has expired. Request a new one.' });
    }

    // Check password reuse
    const reused = await checkPasswordReuse(user, newPassword, bcrypt);
    if (reused) {
      return res.status(400).json({ msg: 'Cannot reuse recent passwords' });
    }

    // Update password
    const newHash = await bcrypt.hash(newPassword, 12);
    if (!user.passwordHistory) user.passwordHistory = [];
    user.passwordHistory.push({ password: newHash, changedAt: new Date() });
    user.password = newHash;
    user.passwordExpiresAt = getPasswordExpiryDate();
    user.lastPasswordChange = new Date();
    
    // Clear OTP
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    
    await user.save();

    await logAction(user._id, 'PASSWORD_RESET_VIA_OTP');

    res.json({ msg: 'Password reset successful! Please login with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Password reset failed' });
  }
});

// ==================== USER PROFILE ====================

// Get user profile
app.get('/api/users/profile', auth, async (req, res) => {
  try {
    console.log('PROFILE REQUEST for user:', req.user?.email);
    const user = req.userDoc;
    
    const postCount = await Post.countDocuments({ user: user._id });
    
    console.log('PROFILE SUCCESS:', user.email);
    res.json({
      user: {
        ...sanitizeUser(user),
        postCount
      }
    });
  } catch (err) {
    console.error('❌ PROFILE ERROR:', err);
    res.status(500).json({ msg: 'cant get profile' });
  }
});

// Update user profile
app.put('/api/users/profile', auth, validateProfile, async (req, res) => {
  try {
    const { bio, profilePrivate } = req.body;
    const user = req.userDoc;

    // Validate inputs
    if (bio && bio.length > 500) {
      return res.status(400).json({ msg: 'Bio too long (max 500 chars)' });
    }

    // Update allowed fields only
    if (bio) user.bio = bio;
    if (typeof profilePrivate === 'boolean') user.profilePrivate = profilePrivate;

    await user.save();

    await logAction(user._id, ACTIONS.PROFILE_UPDATE, { bio: bio?.substring(0, 50), profilePrivate }, req);

    res.json({
      msg: 'Profile updated',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Profile update failed' });
  }
});

// Upload profile picture
app.post('/api/users/avatar/upload', auth, uploadImage.single('avatar'), async (req, res) => {
  try {
    
    if (!req.file) {
      return res.status(400).json({ msg: 'No image uploaded' });
    }

    const user = req.userDoc;
    
    // Save avatar path - include /uploads prefix
    user.avatar = `/uploads/avatars/${req.file.filename}`;
    user.avatarUploadDate = new Date();
    await user.save();

    await logAction(user._id, ACTIONS.AVATAR_UPLOAD, { avatar: user.avatar }, req);

    console.log('✅ Avatar uploaded successfully:', user.avatar);
    res.json({
      msg: 'Profile picture updated successfully',
      avatar: user.avatar,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('❌ Avatar upload error:', err);
    res.status(500).json({ msg: 'Avatar upload failed', error: err.message });
  }
});

// Get public user profile by ID or username
app.get('/api/users/:identifier/profile', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by username
    let user;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier).select('-password -passwordHistory -resetToken -resetTokenExpires -mfa_secret -mfa_backup_codes -mfa_email_otp -sessionToken');
    } else {
      user = await User.findOne({ username: identifier }).select('-password -passwordHistory -resetToken -resetTokenExpires -mfa_secret -mfa_backup_codes -mfa_email_otp -sessionToken');
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if profile is private
    if (user.profilePrivate) {
      return res.status(403).json({ msg: 'This profile is private' });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ user: user._id });

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
        postCount
      }
    });
  } catch (err) {
    console.error('Get public profile error:', err);
    res.status(500).json({ msg: 'Failed to get user profile', error: err.message });
  }
});

// Get current user's own posts
app.get('/api/users/me/posts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    // Build sort query
    let sortQuery = {};
    if (sort === 'recent') {
      sortQuery = { createdAt: -1 };
    } else if (sort === 'popular') {
      sortQuery = { upvotes: -1, createdAt: -1 };
    }

    // Get posts with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await Post.find({ user: req.user.id })
      .sort(sortQuery)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'username avatar')
      .populate('category', 'name slug icon color');

    const totalPosts = await Post.countDocuments({ user: req.user.id });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (err) {
    console.error('Get my posts error:', err);
    res.status(500).json({ msg: 'Failed to get your posts', error: err.message });
  }
});

// Get user's posts by ID or username
app.get('/api/users/:identifier/posts', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    // Try to find user by ID first, then by username
    let user;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier);
    } else {
      user = await User.findOne({ username: identifier });
    }

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if profile is private
    if (user.profilePrivate) {
      return res.status(403).json({ msg: 'This profile is private' });
    }

    // Build sort query
    let sortQuery = {};
    if (sort === 'recent') {
      sortQuery = { createdAt: -1 };
    } else if (sort === 'popular') {
      sortQuery = { upvotes: -1, createdAt: -1 };
    }

    // Get posts with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const posts = await Post.find({ user: user._id })
      .sort(sortQuery)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('user', 'username avatar')
      .populate('category', 'name slug icon color');

    const totalPosts = await Post.countDocuments({ user: user._id });

    res.json({
      posts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPosts / parseInt(limit)),
        totalPosts,
        hasMore: skip + posts.length < totalPosts
      }
    });
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ msg: 'Failed to get user posts', error: err.message });
  }
});

// ==================== POSTS ====================

// Create post with media (authenticated users)
app.post('/api/posts/create', auth, async (req, res) => {
  try {
    const { title, content, category, type, images, videoUrl, files, linkUrl, pollOptions, pollEndsAt } = req.body;

    console.log('Post creation request:', { 
      title, 
      content, 
      category, 
      type, 
      hasImages: !!images, 
      hasVideo: !!videoUrl, 
      hasFiles: !!files, 
      hasLink: !!linkUrl,
      hasPoll: !!pollOptions,
      pollOptionsCount: pollOptions?.length
    });

    // Validate required fields
    if (!title) {
      console.log('Missing title');
      return res.status(400).json({ msg: 'Title is required' });
    }

    if (title.length < 3 || title.length > 200) {
      console.log('Title length invalid:', title.length);
      return res.status(400).json({ msg: 'Title must be 3-200 characters' });
    }

    // Content is optional but if provided, must be under 5000 chars
    if (content && content.length > 5000) {
      console.log('Content too long:', content.length);
      return res.status(400).json({ msg: 'Content must be less than 5000 characters' });
    }

    // Category is optional - use default if not provided
    let postCategory = category;
    if (!postCategory) {
      const defaultCategory = await Category.findOne({ isActive: true });
      postCategory = defaultCategory ? defaultCategory._id : null;
      console.log('Using default category:', postCategory);
    }

    const postData = {
      user: req.user.id,
      title,
      content,
      category: postCategory,
      type: type || 'text',
      images: images || [],
      videoUrl: videoUrl || null,
      files: files || [],
      linkUrl: linkUrl || null,
      published: true,
      upvotes: 0,
      downvotes: 0,
      commentCount: 0
    };

    // Add poll data if it's a poll post
    if (type === 'poll' && pollOptions && pollOptions.length > 0) {
      postData.pollOptions = pollOptions;
      postData.pollEndsAt = pollEndsAt;
      console.log('Creating poll with options:', pollOptions);
    }

    const post = await Post.create(postData);

    // Increment category post count
    if (postCategory) {
      await Category.findByIdAndUpdate(postCategory, { $inc: { postCount: 1 } });
    }

    await logAction(req.user.id, ACTIONS.POST_CREATE, { 
      postId: post._id, 
      title: post.title,
      type: type || 'text',
      category: postCategory 
    }, req);

    const populatedPost = await post.populate('user', 'username avatar');
    console.log('Post created successfully:', post._id);
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error('Post creation error:', err);
    res.status(500).json({ msg: 'Post creation failed', error: err.message });
  }
});

// Create post (authenticated users)
app.post('/api/posts', auth, validatePost, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'title and content required' });
    }

    if (title.length < 5 || title.length > 200) {
      return res.status(400).json({ message: 'title must be 5-200 characters' });
    }

    if (content.length < 10 || content.length > 5000) {
      return res.status(400).json({ message: 'content must be 10-5000 characters' });
    }

    const post = await Post.create({
      user: req.user.id,
      title,
      content,
      published: true
    });

    await logAction(req.user.id, 'POST_CREATED', { postId: post._id });

    res.status(201).json(
      await post.populate('user', 'username avatar')
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'post creation failed' });
  }
});

// Get all posts
app.get('/api/posts', apiLimiter, async (req, res) => {
  try {
    const posts = await Post.find({ published: true })
      .populate('user', 'username avatar bio')
      .populate('category', 'name slug icon color')
      .sort({ createdAt: -1 })
      .limit(50);

    // Add comment count to each post (including replies)
    const Comment = require('./models/Comment');
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ post: post._id });
        const commentCount = comments.reduce((sum, comment) => {
          return sum + 1 + (comment.replies ? comment.replies.length : 0);
        }, 0);
        return {
          ...post.toObject(),
          commentCount
        };
      })
    );

    res.json(postsWithCommentCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed to fetch posts' });
  }
});

// Get posts by category
app.get('/api/posts/category/:slug', apiLimiter, async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }

    const posts = await Post.find({ category: category._id, published: true })
      .populate('user', 'username avatar bio')
      .populate('category', 'name slug icon color')
      .sort({ createdAt: -1 })
      .limit(50);

    // Add comment count to each post (including replies)
    const Comment = require('./models/Comment');
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ post: post._id });
        const commentCount = comments.reduce((sum, comment) => {
          return sum + 1 + (comment.replies ? comment.replies.length : 0);
        }, 0);
        return {
          ...post.toObject(),
          commentCount
        };
      })
    );

    res.json(postsWithCommentCount);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch category posts', error: err.message });
  }
});

// Like post (toggle like)
app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Initialize like tracking array if it doesn't exist
    if (!post.likedBy) post.likedBy = [];

    const userId = req.user.id;
    const hasLiked = post.likedBy.includes(userId);

    if (hasLiked) {
      // Remove like
      post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
      post.upvotes = Math.max(0, (post.upvotes || 1) - 1);
    } else {
      // Add like
      post.likedBy.push(userId);
      post.upvotes = (post.upvotes || 0) + 1;
    }

    await post.save();
    await logAction(req.user.id, 'POST_LIKED', { postId: post._id, liked: !hasLiked });

    res.json({
      upvotes: post.upvotes || 0,
      liked: !hasLiked
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Like failed', error: err.message });
  }
});

// Vote on post (legacy endpoint for backwards compatibility)
app.post('/api/posts/:id/vote', auth, async (req, res) => {
  try {
    const { vote } = req.body; // 'up' or 'down'
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Initialize like tracking array if it doesn't exist
    if (!post.likedBy) post.likedBy = [];

    const userId = req.user.id;
    const hasLiked = post.likedBy.includes(userId);

    // Only handle upvote (like) - ignore downvote
    if (vote === 'up') {
      if (hasLiked) {
        // Remove like
        post.likedBy = post.likedBy.filter(id => id.toString() !== userId);
        post.upvotes = Math.max(0, (post.upvotes || 1) - 1);
      } else {
        // Add like
        post.likedBy.push(userId);
        post.upvotes = (post.upvotes || 0) + 1;
      }
    }

    await post.save();
    await logAction(req.user.id, 'POST_VOTED', { postId: post._id, vote });

    res.json({
      upvotes: post.upvotes || 0,
      downvotes: 0,
      userVote: post.likedBy.includes(userId) ? 'up' : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Vote failed', error: err.message });
  }
});

// Get post by ID
app.get('/api/posts/:id', apiLimiter, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } }, // Increment view count
      { new: true }
    )
    .populate('user', 'username avatar bio')
    .populate('category', 'name slug icon color');

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ msg: 'Failed to fetch post' });
  }
});

// Update own post
app.put('/api/posts/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Only author or admin can edit
    if (post.user.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Cannot edit this post' });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    post.updatedAt = new Date();

    await post.save();
    await logAction(req.user.id, ACTIONS.POST_UPDATE, { postId: post._id, title: post.title }, req);

    res.json({ msg: 'Post updated', post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Post update failed' });
  }
});

// Delete post
app.delete('/api/posts/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'post not found' });
    }

    if (post.user.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'cant delete this post' });
    }

    // Delete associated files from filesystem using utility
    deletePostFiles(post);

    await Post.findByIdAndDelete(req.params.id);
    
    // Update category post count
    if (post.category) {
      await Category.findByIdAndUpdate(post.category, { $inc: { postCount: -1 } });
    }
    
    await logAction(req.user.id, ACTIONS.POST_DELETE, { postId: post._id, title: post.title }, req);

    res.json({ message: 'post deleted with all media' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'post deletion failed' });
  }
});

// ==================== COMMENTS ====================

// Create comment
app.post('/api/comments', auth, validateComment, async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ message: 'post id and content required' });
    }

    if (content.length < 2 || content.length > 1000) {
      return res.status(400).json({ message: 'comment must be 2-1000 characters' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'post not found' });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user.id,
      content
    });

    await logAction(req.user.id, 'COMMENT_CREATED', { postId });

    res.status(201).json(
      await comment.populate('user', 'username avatar')
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'comment creation failed' });
  }
});

// Get comments for post
app.get('/api/posts/:postId/comments', apiLimiter, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    // Format response with populated reply user data
    const formattedComments = await Promise.all(comments.map(async (c) => {
      // Populate reply user data
      const repliesWithUserData = await Promise.all((c.replies || []).map(async (reply) => {
        if (reply.user) {
          const replyUser = await User.findById(reply.user).select('username avatar');
          return {
            ...reply.toObject(),
            authorName: replyUser?.username || reply.authorName || 'Anonymous',
            avatar: replyUser?.avatar || reply.avatar
          };
        }
        return {
          ...reply.toObject(),
          authorName: reply.authorName || 'Anonymous'
        };
      }));

      return {
        _id: c._id,
        id: c._id,
        content: c.content,
        userId: c.user._id,
        authorName: c.user.username,
        avatar: c.user.avatar,
        likes: c.likes || 0,
        createdAt: c.createdAt,
        replies: repliesWithUserData
      };
    }));

    res.json(formattedComments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed to fetch comments' });
  }
});

// Create comment on post
app.post('/api/posts/:postId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.postId).populate('user');
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user.id,
      content: content.trim(),
      likes: 0,
      replies: []
    });

    await comment.populate('user', 'username avatar');
    await logAction(req.user.id, ACTIONS.COMMENT_CREATE, { postId: req.params.postId, commentId: comment._id }, req);

    // Create notification for post author
    if (post.user && post.user._id) {
      await createNotification(
        post.user._id,
        req.user.id,
        'comment',
        `commented on your post: "${post.title}"`,
        post._id,
        comment._id
      );
    }

    res.status(201).json({
      _id: comment._id,
      id: comment._id,
      content: comment.content,
      userId: comment.user._id,
      authorName: comment.user.username,
      avatar: comment.user.avatar,
      likes: comment.likes || 0,
      createdAt: comment.createdAt,
      replies: comment.replies || []
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to create comment' });
  }
});

// Like comment
app.post('/api/posts/:postId/comments/:commentId/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Initialize likedBy if it doesn't exist
    if (!comment.likedBy) {
      comment.likedBy = [];
    }

    const hasLiked = comment.likedBy.includes(req.user.id);
    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== req.user.id);
      comment.likes = Math.max(0, (comment.likes || 1) - 1);
    } else {
      comment.likedBy.push(req.user.id);
      comment.likes = (comment.likes || 0) + 1;
    }

    await comment.save();
    res.json({ likes: comment.likes, liked: !hasLiked });
  } catch (err) {
    console.error('Comment like error:', err);
    res.status(500).json({ msg: 'Failed to like comment' });
  }
});

// Add reply to comment
app.post('/api/posts/:postId/comments/:commentId/reply', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ msg: 'Reply content is required' });
    }

    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    const user = await User.findById(req.user.id);

    const reply = {
      _id: new mongoose.Types.ObjectId(),
      user: req.user.id,
      authorName: user.username,
      avatar: user.avatar,
      content: content.trim(),
      createdAt: new Date()
    };

    comment.replies.push(reply);
    await comment.save();
    await logAction(req.user.id, 'REPLY_CREATED', { commentId: comment._id });

    res.status(201).json(reply);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to add reply' });
  }
});

// Delete reply from comment
app.delete('/api/posts/:postId/comments/:commentId/replies/:replyId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    const reply = comment.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ msg: 'Reply not found' });
    }

    // Check if user owns the reply or is admin
    if (reply.user.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this reply' });
    }

    comment.replies.pull(req.params.replyId);
    await comment.save();
    await logAction(req.user.id, 'REPLY_DELETED', { commentId: comment._id, replyId: req.params.replyId });

    res.json({ msg: 'Reply deleted successfully' });
  } catch (err) {
    console.error('Delete reply error:', err);
    res.status(500).json({ msg: 'Failed to delete reply' });
  }
});

// Delete comment
app.delete('/api/posts/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'comment not found' });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'cant delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    await logAction(req.user.id, ACTIONS.COMMENT_DELETE, { commentId: comment._id }, req);

    res.json({ message: 'comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'comment deletion failed' });
  }
});

// Old delete comment endpoint (keep for backwards compatibility)
app.delete('/api/comments/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'comment not found' });
    }

    if (comment.user.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'cant delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);
    await logAction(req.user.id, ACTIONS.COMMENT_DELETE, { commentId: comment._id }, req);

    res.json({ message: 'comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'comment deletion failed' });
  }
});

// ==================== MEDIA UPLOAD ====================

// Upload avatar
app.post('/api/upload/avatar', auth, uploadImage.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const avatarUrl = `/avatars/${req.file.filename}`;
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Avatar upload failed', error: err.message });
  }
});

// Upload post images (up to 10)
app.post('/api/upload/post-images', auth, uploadImage.array('postImages', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No images uploaded' });
    }

    const images = req.files.map(file => `/uploads/posts/images/${file.filename}`);
    console.log('✅ Images uploaded:', images);
    res.json({ images });
  } catch (err) {
    console.error('❌ Image upload error:', err);
    res.status(500).json({ msg: 'Image upload failed', error: err.message });
  }
});

// Upload post video (max 500MB)
app.post('/api/upload/post-video', auth, uploadVideo.single('postVideo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No video uploaded' });
    }

    const videoUrl = `/uploads/posts/videos/${req.file.filename}`;
    console.log('✅ Video uploaded:', videoUrl);
    res.json({ videoUrl });
  } catch (err) {
    console.error('❌ Video upload error:', err);
    res.status(500).json({ msg: 'Video upload failed', error: err.message });
  }
});

// Upload post files (up to 5, for mods/attachments)
app.post('/api/upload/post-files', auth, uploadFile.array('postFiles', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      url: `/uploads/posts/files/${file.filename}`,
      name: file.originalname,
      size: file.size
    }));
    console.log('✅ Files uploaded:', files);
    res.json({ files });
  } catch (err) {
    console.error('❌ File upload error:', err);
    res.status(500).json({ msg: 'File upload failed', error: err.message });
  }
});

// Upload category image (Admin/Moderator only)
app.post('/api/upload/category-image', auth, checkRole(['Admin', 'Moderator']), uploadImage.single('categoryImage'), async (req, res) => {
  try {
    console.log('Category image upload request received');
    console.log('User:', req.user?.email);
    console.log('File:', req.file);
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ msg: 'No image uploaded' });
    }

    const imageUrl = `/uploads/categories/${req.file.filename}`;
    console.log('✅ Image uploaded successfully:', imageUrl);
    res.json({ imageUrl });
  } catch (err) {
    console.error('❌ Category image upload error:', err);
    res.status(500).json({ msg: 'Category image upload failed', error: err.message });
  }
});

// Upload images to post (up to 10 images per post)
app.post('/api/posts/:postId/upload-images', auth, uploadImage.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No images provided' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Add image paths to post
    post.images = post.images || [];
    const imagePaths = req.files.map(file => `/posts/images/${file.filename}`);
    post.images.push(...imagePaths);

    // Limit to 10 total
    if (post.images.length > 10) {
      post.images = post.images.slice(-10);
    }

    await post.save();
    await logAction(req.user.id, 'POST_IMAGES_ADDED', { postId: post._id, count: req.files.length });

    res.json({
      msg: 'Images uploaded successfully',
      images: imagePaths,
      post: await post.populate('user', 'username avatar')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Image upload failed' });
  }
});

// Upload video to post (max 500MB)
app.post('/api/posts/:postId/upload-video', auth, uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No video provided' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Store video path
    post.videoUrl = `/posts/videos/${req.file.filename}`;

    await post.save();
    await logAction(req.user.id, 'POST_VIDEO_ADDED', { postId: post._id, fileName: req.file.originalname });

    res.json({
      msg: 'Video uploaded successfully',
      videoUrl: post.videoUrl,
      post: await post.populate('user', 'username avatar')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Video upload failed' });
  }
});

// ==================== LOGOUT ====================

// Logout endpoint
app.post('/api/users/logout', auth, async (req, res) => {
  try {
    const user = req.userDoc;
    
    // Clear session token
    user.sessionToken = undefined;
    user.sessionExpiresAt = undefined;
    await user.save();

    await logAction(user._id, ACTIONS.LOGOUT, { email: user.email }, req);

    res.json({ msg: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ msg: 'Logout failed' });
  }
});

// ==================== PAYMENTS ====================

// Create payment with Square Payments API
app.post('/api/payments', auth, async (req, res) => {
  try {
    const { amount, sourceId } = req.body;
    
    console.log('PAYMENT REQUEST:', { amount, sourceId: sourceId?.substring(0, 20) + '...', user: req.user.email });

    if (!amount || !sourceId) {
      console.log('PAYMENT FAILED: Missing amount or sourceId');
      return res.status(400).json({ msg: 'Amount and sourceId required' });
    }

    const amountNum = parseInt(amount);
    if (amountNum < 100 || amountNum > 5000000) {
      console.log('PAYMENT FAILED: Invalid amount:', amountNum);
      return res.status(400).json({ msg: 'Invalid amount (must be between $1 and $50,000)' });
    }

    // Check if Square credentials are configured
    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
      console.log('PAYMENT FAILED: Square credentials not configured!');
      console.log('SQUARE_ACCESS_TOKEN exists?', !!process.env.SQUARE_ACCESS_TOKEN);
      console.log('SQUARE_LOCATION_ID:', process.env.SQUARE_LOCATION_ID || 'MISSING');
      return res.status(500).json({ 
        msg: 'Payment system not configured. Please contact administrator.' 
      });
    }

    try {
      console.log('✅ Square credentials found - Processing payment...');
      console.log('Processing Square payment:', { amount: amountNum, user: req.user.id });
      
      // Use direct HTTPS call instead of SDK (SDK has issues)
      const paymentData = JSON.stringify({
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount: amountNum,
          currency: 'GBP'
        }
      });

      const https = require('https');
      const options = {
        hostname: 'connect.squareupsandbox.com',
        path: '/v2/payments',
        method: 'POST',
        headers: {
          'Square-Version': '2024-07-17',
          'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': paymentData.length
        }
      };

      const paymentPromise = new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`Payment failed: ${data}`));
            }
          });
        });
        req.on('error', reject);
        req.write(paymentData);
        req.end();
      });

      const result = await paymentPromise;
      const payment = result.payment;
      console.log('Square payment response:', payment.status);

      // Save payment record
      const paymentRecord = await Payment.create({
        user: req.user.id,
        squarePaymentId: payment.id,
        amount: payment.amount_money.amount,
        currency: payment.amount_money.currency,
        status: payment.status.toLowerCase(),
        paymentMethod: 'square',
        description: 'Donation',
        completedAt: payment.status === 'COMPLETED' ? new Date() : null
      });

      // Log the payment
      await logAction(req.user.id, 'PAYMENT', { 
        paymentId: payment.id, 
        amount: amountNum,
        status: payment.status 
      }, req);

      console.log('✅ Payment processed successfully:', paymentRecord._id);

      res.json({
        msg: 'Payment processed successfully',
        payment: {
          id: paymentRecord._id,
          status: 'COMPLETED',
          amount: payment.amount_money.amount
        }
      });
    } catch (squareErr) {
      console.error('Square API error:', squareErr);
      
      // Log failed payment attempt
      await logAction(req.user.id, 'PAYMENT', { 
        amount: amountNum,
        status: 'FAILED',
        error: squareErr.message 
      }, req);
      
      return res.status(500).json({ 
        msg: 'Payment processing failed', 
        error: squareErr.errors?.[0]?.detail || squareErr.message || 'Square API error'
      });
    }
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ msg: 'Payment processing failed', error: err.message });
  }
});

// ==================== ADMIN FEATURES ====================

// Get audit logs (admin only)
app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(1000);

    res.json({ logs, count: logs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch audit logs' });
  }
});

// Get user by ID (admin only)
app.get('/api/admin/users/:id', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch user' });
  }
});

// Lock user account (admin only)
app.post('/api/admin/users/:id/lock', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { lockUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, // 7 days
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    await logAction(req.user.id, 'ADMIN_LOCKED_USER', { targetUser: user._id });

    res.json({ msg: 'User account locked', user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'User lock failed' });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// Get admin stats/dashboard
app.get('/api/admin/stats', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    
    // Count total comments including replies
    const comments = await Comment.find();
    const totalComments = comments.reduce((sum, comment) => {
      return sum + 1 + (comment.replies ? comment.replies.length : 0);
    }, 0);
    
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(5).populate('user', 'username');
    
    // Calculate total donations
    const donations = await Payment.find({ status: 'completed' });
    const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalDonations: totalDonations.toFixed(2),
      donationCount: donations.length,
      recentUsers: recentUsers.map(u => ({ _id: u._id, username: u.username, email: u.email, createdAt: u.createdAt })),
      recentPosts: recentPosts.map(p => ({ _id: p._id, title: p.title, author: p.user.username, createdAt: p.createdAt }))
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ msg: 'Failed to fetch stats', error: err.message });
  }
});

// Get all donations (admin only)
app.get('/api/admin/donations', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const donations = await Payment.find()
      .populate('user', 'username email')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch donations', error: err.message });
  }
});

// Get all users (admin only)
app.get('/api/admin/users', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const users = await User.find(query).select('-password -mfa_secret -mfa_backup_codes').sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments();
    
    res.json({ users, totalUsers });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ msg: 'Failed to fetch users', error: err.message });
  }
});

// Ban user (admin only)
app.post('/api/admin/users/:userId/ban', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    if (user.role === 'Admin') {
      return res.status(403).json({ msg: 'Cannot ban admin users' });
    }
    
    user.isBanned = true;
    user.banReason = reason || 'Violation of terms';
    user.bannedAt = new Date();
    user.bannedBy = req.user.id;
    await user.save();
    
    await logAction(req.user.id, 'USER_BAN', { 
      bannedUserId: user._id, 
      bannedUsername: user.username,
      reason 
    }, req);
    
    console.log('User banned:', user.username, 'by', req.user.email);
    res.json({ msg: 'User banned successfully', user: { username: user.username, isBanned: true } });
  } catch (err) {
    console.error('Ban user error:', err);
    res.status(500).json({ msg: 'Failed to ban user', error: err.message });
  }
});

// Unban user (admin only)
app.post('/api/admin/users/:userId/unban', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Unban and unlock account
    user.isBanned = false;
    user.banReason = undefined;
    user.bannedAt = undefined;
    user.bannedBy = undefined;
    user.lockUntil = undefined;
    user.failedLoginAttempts = 0;
    await user.save();
    
    await logAction(req.user.id, 'USER_UNBAN', { 
      unbannedUserId: user._id, 
      unbannedUsername: user.username 
    }, req);
    
    console.log('User unbanned and unlocked:', user.username, 'by', req.user.email);
    res.json({ msg: 'User unbanned successfully', user: { username: user.username, isBanned: false } });
  } catch (err) {
    console.error('Unban user error:', err);
    res.status(500).json({ msg: 'Failed to unban user', error: err.message });
  }
});

// Get all posts (admin only) with filtering and search
app.get('/api/admin/posts', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = {};
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const posts = await Post.find(query)
      .populate('user', 'username email avatar')
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });
    
    // Add comment count
    const Comment = require('./models/Comment');
    const postsWithCommentCount = await Promise.all(
      posts.map(async (post) => {
        const comments = await Comment.find({ post: post._id });
        const commentCount = comments.reduce((sum, comment) => {
          return sum + 1 + (comment.replies ? comment.replies.length : 0);
        }, 0);
        return {
          ...post.toObject(),
          commentCount
        };
      })
    );
    
    res.json(postsWithCommentCount);
  } catch (err) {
    console.error('Get admin posts error:', err);
    res.status(500).json({ msg: 'Failed to fetch posts', error: err.message });
  }
});

// Get user details (admin only)
app.get('/api/admin/users/:id', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -mfa_secret -mfa_backup_codes');
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const userPosts = await Post.find({ user: req.params.id });
    const userComments = await Comment.find({ user: req.params.id });
    const userReports = await Report.find({ $or: [{ user: req.params.id }, { targetUserId: req.params.id }] });

    res.json({
      user,
      stats: {
        postsCount: userPosts.length,
        commentsCount: userComments.length,
        reportsCount: userReports.length,
        joinedDate: user.createdAt
      },
      recentPosts: userPosts.slice(-5),
      reports: userReports
    });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch user details', error: err.message });
  }
});

// Lock/unlock user (admin only)
app.post('/api/admin/users/:id/lock', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { locked } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { locked: locked || false },
      { new: true }
    ).select('-password -mfa_secret -mfa_backup_codes');

    if (!user) return res.status(404).json({ msg: 'User not found' });

    await logAction(req.user.id, ACTIONS.USER_LOCK, { targetUserId: user._id, username: user.username }, req);
    res.json({ msg: locked ? 'User locked' : 'User unlocked', user });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to update user', error: err.message });
  }
});

// Get user activity logs
app.get('/api/users/activity-logs', auth, async (req, res) => {
  try {
    const logs = await AuditLog.find({ user: req.user.id }).sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch activity logs', error: err.message });
  }
});

// ==================== POLLS ====================

// Search users (for navbar search)
app.get('/api/users/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username avatar bio')
    .limit(5);
    
    res.json(users);
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ msg: 'Search failed', error: err.message });
  }
});

// ==================== POLLS ====================

// Vote on poll
app.post('/api/posts/:id/poll/vote', auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || post.type !== 'poll') {
      return res.status(404).json({ msg: 'Poll not found' });
    }

    // Check if poll has ended
    if (post.pollEndsAt && new Date() > new Date(post.pollEndsAt)) {
      return res.status(400).json({ msg: 'Poll has ended' });
    }

    if (optionIndex === undefined || !post.pollOptions[optionIndex]) {
      return res.status(400).json({ msg: 'Invalid option' });
    }

    const userId = req.user.id;
    
    // Check if user already voted
    const alreadyVoted = post.pollOptions.some(opt => 
      opt.votedBy && opt.votedBy.includes(userId)
    );

    if (alreadyVoted && !post.pollAllowMultiple) {
      // Remove previous vote
      post.pollOptions.forEach(opt => {
        if (opt.votedBy) {
          opt.votedBy = opt.votedBy.filter(id => id.toString() !== userId);
          opt.votes = opt.votedBy.length;
        }
      });
    }

    // Add new vote
    if (!post.pollOptions[optionIndex].votedBy) {
      post.pollOptions[optionIndex].votedBy = [];
    }
    
    if (!post.pollOptions[optionIndex].votedBy.includes(userId)) {
      post.pollOptions[optionIndex].votedBy.push(userId);
      post.pollOptions[optionIndex].votes = post.pollOptions[optionIndex].votedBy.length;
    }

    await post.save();
    await logAction(userId, 'POLL_VOTED', { postId: post._id, optionIndex });

    res.json({ msg: 'Vote recorded', pollOptions: post.pollOptions });
  } catch (err) {
    console.error('Poll vote error:', err);
    res.status(500).json({ msg: 'Failed to vote', error: err.message });
  }
});

// ==================== NOTIFICATIONS ====================

const Notification = require('./models/Notification');

// Get user notifications
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const { unreadOnly = false, limit = 20 } = req.query;
    
    const query = { recipient: req.user.id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username avatar')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ msg: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json(notification);
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ msg: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ msg: 'Failed to mark all as read' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json({ msg: 'Notification deleted' });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({ msg: 'Failed to delete notification' });
  }
});

// Helper function to create notification
async function createNotification(recipientId, senderId, type, message, postId = null, commentId = null) {
  try {
    // Don't notify yourself
    if (recipientId.toString() === senderId.toString()) {
      return;
    }

    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      post: postId,
      comment: commentId
    });
  } catch (err) {
    console.error('Create notification error:', err);
  }
}

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(` Gaming Forum API running on http://localhost:${PORT}`);
    console.log(`Remember to set JWT_SECRET and SQUARE_ACCESS_TOKEN in .env`);
  });
}

// Export app for testing
module.exports = app;
