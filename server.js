const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// MongoDB
const connectDB = require('./db');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');

// Middleware
const auth = require('./middleware/auth');

// Square SDK
const { Client } = require('square'); // fix import
const squareClient = new Client({
  environment: 'sandbox', // use string 'sandbox' for Sandbox
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
connectDB();

// Rate limiter for login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again later.'
});

// Helpers
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({ user: userId, action, metadata });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ msg: 'Access denied' });
  next();
};

const isStrongPassword = (password) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Test
app.get('/', (req, res) => res.send('Secure Forum API running'));

// ----------------- Users -----------------

app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ msg: 'All fields required' });
    if (!isStrongPassword(password)) return res.status(400).json({ msg: 'Weak password' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword });

    await logAction(user._id, 'User registered');
    res.status(201).json({ msg: 'User registered', user: { _id: user._id, username, email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'All fields required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    if (user.lockUntil && user.lockUntil > Date.now()) return res.status(403).json({ msg: 'Account locked' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
        await logAction(user._id, 'Account locked');
      }
      await user.save();
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // MFA
    if (user.mfa_enabled) {
      const otp = generateOTP();
      user.mfa_otp = await bcrypt.hash(otp, 10);
      user.mfa_expires = Date.now() + 5 * 60 * 1000;
      await user.save();
      console.log(`MFA OTP for ${user.email}: ${otp}`);
      await logAction(user._id, 'MFA OTP generated');
      return res.json({ msg: 'MFA required', userId: user._id });
    }

    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await logAction(user._id, 'User logged in');
    res.json({ msg: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/users/verify-mfa', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ msg: 'OTP required' });

    const user = await User.findById(userId);
    if (!user || !user.mfa_otp) return res.status(400).json({ msg: 'Invalid request' });
    if (user.mfa_expires < Date.now()) return res.status(400).json({ msg: 'OTP expired' });

    const validOtp = await bcrypt.compare(otp, user.mfa_otp);
    if (!validOtp) return res.status(400).json({ msg: 'Invalid OTP' });

    user.mfa_otp = null;
    user.mfa_expires = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await logAction(user._id, 'MFA verified');
    res.json({ msg: 'MFA success', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ----------------- Posts -----------------

app.post('/api/posts', auth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ msg: 'All fields required' });

  const post = await Post.create({ user: req.user.id, title, content });
  await logAction(req.user.id, 'Created post', { postId: post._id });
  res.status(201).json(post);
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().populate('user', 'username role').sort({ createdAt: -1 });
  res.json(posts);
});

app.delete('/api/posts/:id', auth, checkRole(['Admin']), async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  await logAction(req.user.id, 'Admin deleted post');
  res.json({ msg: 'Post deleted' });
});

// ----------------- Comments -----------------

app.post('/api/comments', auth, async (req, res) => {
  const { postId, content } = req.body;
  if (!postId || !content) return res.status(400).json({ msg: 'All fields required' });

  const comment = await Comment.create({ post: postId, user: req.user.id, content });
  await logAction(req.user.id, 'Created comment');
  res.status(201).json(comment);
});

app.get('/api/comments/:postId', async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId }).populate('user', 'username role').sort({ createdAt: 1 });
  res.json(comments);
});

// ----------------- Audit Logs -----------------

app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (req, res) => {
  const logs = await AuditLog.find().populate('user', 'username role').sort({ createdAt: -1 });
  res.json(logs);
});

// ----------------- Payments (Square Sandbox) -----------------

app.post('/api/payments', auth, async (req, res) => {
  try {
    const { sourceId, amount } = req.body;
    if (!sourceId || !amount) return res.status(400).json({ msg: 'sourceId and amount required' });

    const paymentsApi = squareClient.paymentsApi;
    const requestBody = {
      sourceId,
      idempotencyKey: `${Date.now()}-${Math.random()}`,
      amountMoney: { amount: parseInt(amount), currency: 'USD' }
    };

    const { result } = await paymentsApi.createPayment(requestBody);
    await logAction(req.user.id, 'Payment created', { paymentId: result.payment.id });
    res.json(result.payment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Payment error');
  }
});

// ----------------- Start -----------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
