const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// DB
const connectDB = require('./db');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');

// Middleware
const auth = require('./middleware/auth');

// Square SDK (CORRECT)
const { SquareClient } = require('square');
const squareClient = new SquareClient({
  environment: 'sandbox',
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(cors());
app.use(express.json());
connectDB();

// Rate limit login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Helpers
const logAction = async (userId, action, meta = {}) => {
  try {
    await AuditLog.create({ user: userId, action, metadata: meta });
  } catch {}
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Forbidden' });
  }
  next();
};

const strongPassword = (p) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(p);

// Test
app.get('/', (req, res) => {
  res.send('API running');
});


// ---------- USERS ----------

app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ msg: 'Missing fields' });

    if (!strongPassword(password))
      return res.status(400).json({ msg: 'Weak password' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hash });

    await logAction(user._id, 'REGISTER');
    res.status(201).json({ msg: 'User registered' });
  } catch (e) {
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid login' });

    if (user.lockUntil && user.lockUntil > Date.now())
      return res.status(403).json({ msg: 'Account locked' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      }
      await user.save();
      return res.status(400).json({ msg: 'Invalid login' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await logAction(user._id, 'LOGIN');
    res.json({ token });
  } catch {
    res.status(500).json({ msg: 'Server error' });
  }
});


// ---------- POSTS ----------

app.post('/api/posts', auth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ msg: 'Missing fields' });

  const post = await Post.create({
    user: req.user.id,
    title,
    content
  });

  await logAction(req.user.id, 'CREATE_POST', { postId: post._id });
  res.status(201).json(post);
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });

  res.json(posts);
});

app.delete('/api/posts/:id', auth, checkRole(['Admin']), async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  await logAction(req.user.id, 'DELETE_POST');
  res.json({ msg: 'Deleted' });
});


// ---------- COMMENTS ----------

app.post('/api/comments', auth, async (req, res) => {
  const { postId, content } = req.body;
  if (!postId || !content)
    return res.status(400).json({ msg: 'Missing fields' });

  const comment = await Comment.create({
    post: postId,
    user: req.user.id,
    content
  });

  await logAction(req.user.id, 'COMMENT');
  res.status(201).json(comment);
});

app.get('/api/comments/:postId', async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('user', 'username role')
    .sort({ createdAt: 1 });

  res.json(comments);
});


// ---------- AUDIT LOGS ----------

app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (req, res) => {
  const logs = await AuditLog.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });

  res.json(logs);
});


// ---------- PAYMENTS (SQUARE SANDBOX) ----------

app.post('/api/payments', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) return res.status(400).json({ msg: 'Amount required' });

    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId: 'cnon:card-nonce-ok',
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: parseInt(amount),
        currency: 'USD'
      }
    });

    await logAction(req.user.id, 'PAYMENT', {
      paymentId: result.payment.id
    });

    res.json(result.payment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Payment failed' });
  }
});


// ---------- START ----------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
