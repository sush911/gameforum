const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
require('dotenv').config();

// DB
const connectDB = require('./db');

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');
const Payment = require('./models/Payment');

// Middleware
const auth = require('./middleware/auth');

// ✅ Square SDK (FIXED)
const { SquareClient } = require('square');
const squareClient = new SquareClient({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: 'sandbox'
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
connectDB();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

// Helpers
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({ user: userId, action, metadata });
  } catch {}
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ msg: 'Forbidden' });
  next();
};

const strongPassword = (p) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(p);

// Test
app.get('/', (req, res) => res.send('API running'));

// USERS
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
  } catch {
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

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ msg: 'Invalid login' });

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

// POSTS
app.post('/api/posts', auth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ msg: 'Missing fields' });

  const post = await Post.create({ user: req.user.id, title, content });
  await logAction(req.user.id, 'CREATE_POST');
  res.status(201).json(post);
});

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });
  res.json(posts);
});

// COMMENTS
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

// PAYMENTS (SQUARE SANDBOX)
app.post('/api/payments', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount)
      return res.status(400).json({ msg: 'Amount required' });

    const response = await squareClient.paymentsApi.createPayment({
      sourceId: 'cnon:card-nonce-ok',
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: parseInt(amount),
        currency: 'USD'
      }
    });

    const payment = response.result.payment;

    await Payment.create({
      user: req.user.id,
      squarePaymentId: payment.id,
      amount: payment.amountMoney.amount,
      status: payment.status
    });

    await logAction(req.user.id, 'PAYMENT', { paymentId: payment.id });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Payment failed' });
  }
});

// START
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
