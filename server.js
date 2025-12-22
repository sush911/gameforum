const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
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

app.use(cors());
app.use(express.json());

connectDB();

/* rate limit */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

/* square sandbox */
const squareClient = new Client({
  environment: Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN
});
const paymentsApi = squareClient.paymentsApi;

/* helpers */
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({ user: userId, action, metadata });
  } catch {}
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  next();
};

const strongPassword = (p) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(p);

const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* test */
app.get('/', (_, res) => res.send('Secure Forum API running'));

/* register */
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ msg: 'All fields required' });

    if (!strongPassword(password))
      return res.status(400).json({ msg: 'Weak password' });

    if (await User.findOne({ email }))
      return res.status(400).json({ msg: 'Email exists' });

    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'User'
    });

    await logAction(user._id, 'User registered');
    res.status(201).json({ msg: 'Registered' });
  } catch {
    res.status(500).send('Server error');
  }
});

/* login */
app.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    if (user.lockUntil && user.lockUntil > Date.now())
      return res.status(403).json({ msg: 'Account locked' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 5)
        user.lockUntil = Date.now() + 15 * 60 * 1000;
      await user.save();
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    if (user.mfa_enabled) {
      const otp = generateOTP();
      user.mfa_otp = await bcrypt.hash(otp, 10);
      user.mfa_expires = Date.now() + 5 * 60 * 1000;
      await user.save();

      console.log(`MFA OTP for ${user.email}: ${otp}`);
      return res.json({ msg: 'MFA required', userId: user._id });
    }

    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role },
      process.env.JWT_SECRET, { expiresIn: '1h' });

    await logAction(user._id, 'Login');
    res.json({ token });
  } catch {
    res.status(500).send('Server error');
  }
});

/* verify mfa */
app.post('/api/users/verify-mfa', async (req, res) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId);

  if (!user || !user.mfa_otp || user.mfa_expires < Date.now())
    return res.status(400).json({ msg: 'Invalid OTP' });

  if (!(await bcrypt.compare(otp, user.mfa_otp)))
    return res.status(400).json({ msg: 'Invalid OTP' });

  user.mfa_otp = null;
  user.mfa_expires = null;
  await user.save();

  const token = jwt.sign({ id: user._id, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '1h' });

  await logAction(user._id, 'MFA verified');
  res.json({ token });
});

/* enable mfa */
app.post('/api/users/enable-mfa', auth, async (req, res) => {
  req.userDoc.mfa_enabled = true;
  await req.userDoc.save();
  await logAction(req.user.id, 'MFA enabled');
  res.json({ msg: 'MFA enabled' });
});

/* posts */
app.post('/api/posts', auth, async (req, res) => {
  const post = await Post.create({
    user: req.user.id,
    title: req.body.title,
    content: req.body.content
  });
  await logAction(req.user.id, 'Post created');
  res.status(201).json(post);
});

app.get('/api/posts', async (_, res) => {
  const posts = await Post.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });
  res.json(posts);
});

/* comments */
app.post('/api/comments', auth, async (req, res) => {
  const comment = await Comment.create({
    post: req.body.postId,
    user: req.user.id,
    content: req.body.content
  });
  await logAction(req.user.id, 'Comment created');
  res.status(201).json(comment);
});

/* audit logs */
app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (_, res) => {
  const logs = await AuditLog.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });
  res.json(logs);
});

/* sandbox payment */
app.post('/api/payments', auth, async (req, res) => {
  const { nonce, amount } = req.body;
  const response = await paymentsApi.createPayment({
    sourceId: nonce,
    idempotencyKey: crypto.randomUUID(),
    amountMoney: { amount, currency: 'USD' }
  });

  await logAction(req.user.id, 'Payment', { amount });
  res.json(response.result.payment);
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
