const express = require('express');
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
const Payment = require('./models/Payment');
const Category = require('./models/Category');

// Middleware
const auth = require('./middleware/auth');
const checkRole = require('./middleware/role');
const { setCSRFToken, csrfProtection } = require('./middleware/csrf');
const { uploadImage, uploadVideo, uploadFile } = require('./middleware/upload');
const {
  validateRegistration,
  validateLogin,
  validatePost,
  validateComment,
  validateProfile,
  validatePasswordChange
} = require('./middleware/validate');

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
const { sendPasswordResetEmail, sendWelcomeEmail } = require('./utils/email');

// Square payment client
const { SquareClient } = require('square');
const squareClient = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: 'sandbox'
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet()); // Set security headers
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(setCSRFToken); // Set CSRF token cookie
connectDB();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { msg: 'Too many login attempts. Try again in 15 minutes.' },
  skip: (req) => req.user && req.user.role === 'Admin'
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { msg: 'Too many registrations. Try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

// Log user action
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      metadata,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// Health check
app.get('/', (req, res) => res.json({ msg: 'Gaming Forum API' }));

// Get CSRF token
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.cookies.csrfToken });
});

// ==================== USER AUTHENTICATION ====================

// Register endpoint
app.post('/api/users/register', registerLimiter, validateRegistration, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // validate input
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ msg: 'all fields needed' });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({ msg: 'username 3-30 chars, letters numbers underscore' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ msg: 'bad email' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        msg: 'password needs uppercase lowercase number and special char, 8+ chars'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ msg: 'passwords dont match' });
    }

    // check user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ msg: 'email or username already used' });
    }

    // hash and create
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      password: hash,
      passwordHistory: [{ password: hash, changedAt: new Date() }],
      passwordExpiresAt: getPasswordExpiryDate(),
      lastPasswordChange: new Date()
    });

    await logAction(user._id, 'REGISTERED', { email });

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(email, username).catch(err => 
      console.error('Welcome email failed:', err.message)
    );

    res.status(201).json({
      msg: 'registered',
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

    // basic validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'email and password needed' });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ msg: 'wrong email or password' });
    }

    // check if locked
    if (isAccountLocked(user)) {
      const minutesLeft = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
      return res.status(401).json({
        msg: `account locked, try again in ${minutesLeft} mins`
      });
    }

    // check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        await logAction(user._id, 'ACCOUNT_LOCKED', { reason: 'too many tries' });
      }
      
      await user.save();
      return res.status(401).json({ msg: 'wrong email or password' });
    }

    // check password expired
    if (isPasswordExpired(user)) {
      return res.status(403).json({ msg: 'password expired, reset it' });
    }

    // reset failed tries
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    // check mfa
    if (user.mfa_enabled) {
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

    user.sessionToken = generateSessionToken();
    user.sessionExpiresAt = getSessionExpiryTime();
    await user.save();

    await logAction(user._id, 'LOGIN', { ip: req.ip });

    res.json({
      msg: 'login ok',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
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

// Enable MFA
app.post('/api/users/mfa/enable', auth, async (req, res) => {
  try {
    const { secret, backupCodes, token } = req.body;

    if (!secret || !token || !backupCodes) {
      return res.status(400).json({ msg: 'Missing MFA data' });
    }

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(token),
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ msg: 'Invalid MFA token' });
    }

    // Hash backup codes
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Enable MFA on user account
    const user = req.userDoc;
    user.mfa_enabled = true;
    user.mfa_secret = secret;
    user.mfa_backup_codes = hashedBackupCodes;
    await user.save();

    await logAction(user._id, 'MFA_ENABLED');

    res.json({ msg: 'MFA enabled successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'MFA enable failed' });
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

    await logAction(user._id, 'MFA_VERIFIED');

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

    await logAction(user._id, 'PASSWORD_CHANGED');

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

    await logAction(user._id, 'PASSWORD_RESET_REQUESTED');

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

    await logAction(user._id, 'PASSWORD_RESET_COMPLETED');

    res.json({ msg: 'password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'reset confirmation failed' });
  }
});

// ==================== USER PROFILE ====================

// Get user profile
app.get('/api/users/profile', auth, async (req, res) => {
  try {
    const user = req.userDoc;
    res.json({
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'cant get profile' });
  }
});

// Update user profile
app.put('/api/users/profile', auth, validateProfile, async (req, res) => {
  try {
    const { bio, avatar, profilePrivate } = req.body;
    const user = req.userDoc;

    // Validate inputs
    if (bio && bio.length > 500) {
      return res.status(400).json({ msg: 'Bio too long (max 500 chars)' });
    }

    // Update allowed fields only
    if (bio) user.bio = bio;
    if (typeof profilePrivate === 'boolean') user.profilePrivate = profilePrivate;
    if (avatar && avatar.length < 5000) user.avatar = avatar; // Limit size

    await user.save();

    await logAction(user._id, 'PROFILE_UPDATED');

    res.json({
      msg: 'Profile updated',
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Profile update failed' });
  }
});

// ==================== POSTS ====================

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
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed to fetch posts' });
  }
});

// Get post by ID
app.get('/api/posts/:id', apiLimiter, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } }, // Increment view count
      { new: true }
    ).populate('user', 'username avatar bio');

    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json({ post });
  } catch (err) {
    console.error(err);
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
    await logAction(req.user.id, 'POST_UPDATED', { postId: post._id });

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

    await Post.findByIdAndDelete(req.params.id);
    await logAction(req.user.id, 'POST_DELETED', { postId: post._id });

    res.json({ message: 'post deleted' });
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

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'failed to fetch comments' });
  }
});

// Delete comment
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
    await logAction(req.user.id, 'COMMENT_DELETED', { commentId: comment._id });

    res.json({ message: 'comment deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'comment deletion failed' });
  }
});

// Like comment
app.post('/api/comments/:id/like', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    const alreadyLiked = comment.likedBy.includes(req.user.id);
    
    if (alreadyLiked) {
      comment.likes -= 1;
      comment.likedBy = comment.likedBy.filter(id => id.toString() !== req.user.id);
    } else {
      comment.likes += 1;
      comment.likedBy.push(req.user.id);
    }

    await comment.save();
    res.json({ likes: comment.likes, liked: !alreadyLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to like comment' });
  }
});

// Reply to comment
app.post('/api/comments/:id/reply', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    comment.replies.push({
      user: req.user.id,
      content,
      createdAt: new Date()
    });

    await comment.save();
    const populatedComment = await Comment.findById(comment._id)
      .populate('replies.user', 'username avatar role');
    
    res.json(populatedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to reply' });
  }
});

// Report comment
app.post('/api/comments/:id/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    const alreadyReported = comment.reports.some(r => r.user.toString() === req.user.id);
    if (alreadyReported) {
      return res.status(400).json({ msg: 'You already reported this comment' });
    }

    comment.reports.push({
      user: req.user.id,
      reason,
      createdAt: new Date()
    });

    await comment.save();
    await logAction(req.user.id, 'COMMENT_REPORTED', { commentId: comment._id, reason });
    
    res.json({ msg: 'Comment reported successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to report comment' });
  }
});

// ==================== PAYMENTS ====================

// Create payment (Square sandbox)
app.post('/api/payments', auth, async (req, res) => {
  try {
    const { amount, sourceId } = req.body;

    if (!amount || !sourceId) {
      return res.status(400).json({ msg: 'Amount and sourceId required' });
    }

    if (amount < 1 || amount > 50000) {
      return res.status(400).json({ msg: 'Invalid amount' });
    }

    // Create payment with Square
    const response = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: parseInt(amount),
        currency: 'USD'
      }
    });

    const payment = response.result.payment;

    // Store payment record
    const paymentRecord = await Payment.create({
      user: req.user.id,
      squarePaymentId: payment.id,
      amount: payment.amountMoney.amount,
      currency: payment.amountMoney.currency,
      status: payment.status
    });

    // If successful, update user to premium
    if (payment.status === 'COMPLETED') {
      const user = await User.findByIdAndUpdate(
        req.user.id,
        { isPremium: true },
        { new: true }
      );
      await logAction(req.user.id, 'PREMIUM_ACTIVATED', { paymentId: payment.id });
    }

    await logAction(req.user.id, 'PAYMENT_CREATED', { paymentId: payment.id });

    res.json({
      msg: 'Payment processed',
      payment: {
        id: paymentRecord._id,
        status: payment.status,
        amount: payment.amountMoney.amount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Payment processing failed' });
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

// ==================== UPLOADS ====================

// Upload avatar
app.post('/api/upload/avatar', auth, uploadImage.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    // Update user avatar
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
    
    res.json({ avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Avatar upload failed' });
  }
});

// Upload post images (multiple)
app.post('/api/upload/post-images', auth, uploadImage.array('postImages', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No images uploaded' });
    }
    
    const imageUrls = req.files.map(file => `/uploads/posts/images/${file.filename}`);
    res.json({ images: imageUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Image upload failed' });
  }
});

// Upload post video
app.post('/api/upload/post-video', auth, uploadVideo.single('postVideo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No video uploaded' });
    }
    
    const videoUrl = `/uploads/posts/videos/${req.file.filename}`;
    res.json({ videoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Video upload failed' });
  }
});

// Upload post files (mods, etc)
app.post('/api/upload/post-files', auth, uploadFile.array('postFiles', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ msg: 'No files uploaded' });
    }
    
    const fileUrls = req.files.map(file => ({
      url: `/uploads/posts/files/${file.filename}`,
      name: file.originalname,
      size: file.size
    }));
    
    res.json({ files: fileUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'File upload failed' });
  }
});

// Create post with images/video
app.post('/api/posts/create', auth, async (req, res) => {
  try {
    const { title, content, type, category, images, videoUrl, files, linkUrl, excerpt } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content required' });
    }
    
    const post = await Post.create({
      user: req.user.id,
      category,
      title,
      content,
      type: type || 'text',
      images: images || [],
      videoUrl,
      files: files || [],
      linkUrl,
      excerpt,
      readTime: Math.ceil(content.split(' ').length / 200) // ~200 words per minute
    });
    
    // Update category post count
    if (category) {
      await Category.findByIdAndUpdate(category, { $inc: { postCount: 1 } });
    }
    
    await logAction(req.user.id, 'POST_CREATED', { postId: post._id, type });
    
    const populatedPost = await Post.findById(post._id)
      .populate('user', 'username avatar role')
      .populate('category', 'name slug icon color');
    
    res.status(201).json(populatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Post creation failed' });
  }
});

// Vote on post
app.post('/api/posts/:id/vote', auth, async (req, res) => {
  try {
    const { vote } = req.body; // 'up' or 'down'
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    
    // Check if user already voted
    const existingVote = post.votedBy.find(v => v.user.toString() === req.user.id);
    
    if (existingVote) {
      // Remove old vote
      if (existingVote.vote === 'up') post.upvotes--;
      if (existingVote.vote === 'down') post.downvotes--;
      
      // If same vote, just remove it (toggle off)
      if (existingVote.vote === vote) {
        post.votedBy = post.votedBy.filter(v => v.user.toString() !== req.user.id);
        await post.save();
        return res.json({ upvotes: post.upvotes, downvotes: post.downvotes, userVote: null });
      }
      
      // Otherwise, change vote
      existingVote.vote = vote;
    } else {
      // New vote
      post.votedBy.push({ user: req.user.id, vote });
    }
    
    // Add new vote
    if (vote === 'up') post.upvotes++;
    if (vote === 'down') post.downvotes++;
    
    await post.save();
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes, userVote: vote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Vote failed' });
  }
});

// ==================== CATEGORIES ====================

// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch categories' });
  }
});

// Upload category image
app.post('/api/upload/category-image', auth, checkRole(['Admin', 'Moderator']), uploadImage.single('categoryImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No image uploaded' });
    }
    
    const imageUrl = `/uploads/categories/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Image upload failed' });
  }
});

// Create category (Admin/Moderator only)
app.post('/api/categories', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const { name, description, icon, color, image } = req.body;
    
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const category = await Category.create({
      name,
      slug,
      description,
      icon,
      color,
      image,
      createdBy: req.user.id
    });
    
    await logAction(req.user.id, 'CATEGORY_CREATED', { categoryId: category._id, name });
    
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Category creation failed' });
  }
});

// Update category (Admin/Moderator only)
app.put('/api/categories/:id', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const { name, description, icon, color, isActive, order } = req.body;
    
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, icon, color, isActive, order },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    await logAction(req.user.id, 'CATEGORY_UPDATED', { categoryId: category._id });
    
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Category update failed' });
  }
});

// Delete category (Admin only)
app.delete('/api/categories/:id', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({ msg: 'Category not found' });
    }
    
    await logAction(req.user.id, 'CATEGORY_DELETED', { categoryId: category._id, name: category.name });
    
    res.json({ msg: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Category deletion failed' });
  }
});

// ==================== ADMIN ====================

// Get all users (Admin only)
app.get('/api/admin/users', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -mfa_secret -mfa_backup_codes -passwordHistory')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch users' });
  }
});

// Ban user (Admin only)
app.post('/api/admin/users/:id/ban', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const { reason, duration } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: false,
        banReason: reason,
        bannedUntil: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await logAction(req.user.id, 'USER_BANNED', { userId: user._id, reason, duration });
    
    res.json({ msg: 'User banned', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Ban failed' });
  }
});

// Unban user (Admin only)
app.post('/api/admin/users/:id/unban', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        isActive: true,
        banReason: null,
        bannedUntil: null
      },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await logAction(req.user.id, 'USER_UNBANNED', { userId: user._id });
    
    res.json({ msg: 'User unbanned', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Unban failed' });
  }
});

// Change user role (Admin only)
app.post('/api/admin/users/:id/role', auth, checkRole(['Admin']), async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['User', 'Moderator', 'Admin'].includes(role)) {
      return res.status(400).json({ msg: 'Invalid role' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    await logAction(req.user.id, 'USER_ROLE_CHANGED', { userId: user._id, newRole: role });
    
    res.json({ msg: 'Role updated', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Role update failed' });
  }
});

// Get audit logs (Admin only)
app.get('/api/admin/audit-logs', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user', 'username email')
      .sort({ timestamp: -1 })
      .limit(500);
    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch logs' });
  }
});

// Get reported posts (Moderator/Admin)
app.get('/api/moderation/reports', auth, checkRole(['Admin', 'Moderator']), async (req, res) => {
  try {
    const posts = await Post.find({ reportCount: { $gt: 0 } })
      .populate('user', 'username email')
      .populate('reports.user', 'username')
      .sort({ reportCount: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Failed to fetch reports' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
