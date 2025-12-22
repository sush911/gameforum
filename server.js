const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

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

/* =======================
   GLOBAL MIDDLEWARE
======================= */
app.use(cors());
app.use(express.json()); // REQUIRED for req.body
connectDB();

/* =======================
   RATE LIMITING
======================= */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { msg: 'Too many login attempts. Try again later.' }
});

/* =======================
   HELPERS
======================= */
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      metadata
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'Access denied' });
  }
  next();
};

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
};

/* =======================
   TEST ROUTE
======================= */
app.get('/', (req, res) => {
  res.send('Secure Forum API (MongoDB) running');
});

/* =======================
   USER ROUTES
======================= */

// REGISTER
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ msg: 'All fields required' });

    if (!isStrongPassword(password))
      return res.status(400).json({
        msg: 'Password must contain upper, lower, number & symbol'
      });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ msg: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashed,
      role: 'User'
    });

    await logAction(user._id, 'User registered');

    res.status(201).json({
      msg: 'User registered',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/users/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: 'All fields required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: 'Invalid credentials' });

    // Account lock check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({ msg: 'Account locked. Try later.' });
    }

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

    // Reset counters
    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    // 🔐 MFA CHECK
    if (user.mfa_enabled) {
      const otp = generateOTP();

      user.mfa_otp = await bcrypt.hash(otp, 10);
      user.mfa_expires = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();

      // Simulate sending OTP (for coursework/demo)
      console.log(`MFA OTP for ${user.email}: ${otp}`);

      await logAction(user._id, 'MFA OTP generated');

      return res.json({
        msg: 'MFA required',
        userId: user._id
      });
    }

    await user.save();

    // No MFA → issue token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    await logAction(user._id, 'User logged in');

    res.json({ msg: 'Login successful', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// CREATE POST
app.post('/api/posts', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content)
      return res.status(400).json({ msg: 'All fields required' });

    const post = await Post.create({
      user: req.user.id,
      title,
      content
    });

    await logAction(req.user.id, 'Post created', { postId: post._id });
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET POSTS
app.get('/api/posts', async (req, res) => {
  const posts = await Post.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });
  res.json(posts);
});

// DELETE POST (ADMIN)
app.delete('/api/posts/:id', auth, checkRole(['Admin']), async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  await logAction(req.user.id, 'Post deleted', { postId: req.params.id });
  res.json({ msg: 'Post deleted' });
});

/* =======================
   COMMENTS
======================= */

app.post('/api/comments', auth, async (req, res) => {
  const { postId, content } = req.body;
  if (!postId || !content)
    return res.status(400).json({ msg: 'All fields required' });

  const comment = await Comment.create({
    post: postId,
    user: req.user.id,
    content
  });

  await logAction(req.user.id, 'Comment created', { postId });
  res.status(201).json(comment);
});

app.get('/api/comments/:postId', async (req, res) => {
  const comments = await Comment.find({ post: req.params.postId })
    .populate('user', 'username role')
    .sort({ createdAt: 1 });
  res.json(comments);
});

/* =======================
   AUDIT LOGS (ADMIN)
======================= */
app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (req, res) => {
  const logs = await AuditLog.find()
    .populate('user', 'username role')
    .sort({ createdAt: -1 });
  res.json(logs);
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
