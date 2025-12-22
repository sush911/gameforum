const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { Client, Environment } = require('square');

require('dotenv').config();

const connectDB = require('./db');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');

// Middleware
const auth = require('./middleware/auth');

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
  message: 'Too many login attempts. Try later.'
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

// Square client (sandbox)
const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

// Test route
app.get('/', (req, res) => res.send('Secure Forum API running'));

// ---------------- USERS ----------------

// Register
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ msg: 'All fields required' });
    if (!isStrongPassword(password)) return res.status(400).json({ msg: 'Weak password' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashedPassword, role: 'User' });
    await logAction(user._id, 'User registered');

    res.status(201).json({ msg: 'User registered', user: { _id: user._id, username, email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Login
app.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'All fields required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    if (user.lockUntil && user.lockUntil > Date.now()) return res.status(403).json({ msg: 'Account locked' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) user.lockUntil = Date.now() + 15*60*1000;
      await user.save();
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    await logAction(user._id, 'User logged in');

    res.json({ msg: 'Login success', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ---------------- POSTS ----------------
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

// ---------------- COMMENTS ----------------
app.post('/api/comments', auth, async (req, res) => {
  const { postId, content } = req.body;
  if (!postId || !content) return res.status(400).json({ msg: 'All fields required' });

  const comment = await Comment.create({ post: postId, user: req.user.id, content });
  await logAction(req.user.id, 'Created comment', { commentId: comment._id, postId });
  res.status(201).json(comment);
});

app.get('/api/comments/:postId', async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId }).populate('user', 'username role').sort({ createdAt: 1 });
  res.json(comments);
});

// ---------------- AUDIT LOGS ----------------
app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (req, res) => {
  const logs = await AuditLog.find().populate('user', 'username role').sort({ createdAt: -1 });
  res.json(logs);
});

// ---------------- PAYMENT (SQUARE SANDBOX) ----------------
app.post('/api/payments', auth, async (req, res) => {
  try {
    const { sourceId, amount } = req.body; // sourceId from frontend card nonce
    if (!sourceId || !amount) return res.status(400).json({ msg: 'Missing payment data' });

    const paymentsApi = squareClient.paymentsApi;
    const response = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey: `${req.user.id}-${Date.now()}`,
      amountMoney: { amount: parseInt(amount*100), currency: 'USD' }
    });

    await logAction(req.user.id, 'Payment processed', { paymentId: response.result.payment.id });
    res.json({ msg: 'Payment success', payment: response.result.payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Payment error', error: err.message });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
