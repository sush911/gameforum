const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
app.use(express.json()); // IMPORTANT: fixes req.body undefined

connectDB();

/* =======================
   HELPER FUNCTIONS
======================= */
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({
      user: userId,
      action,
      metadata,
      ip: metadata.ip || null
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    next();
  };
};

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password);
};

/* =======================
   TEST ROUTE
======================= */
app.get('/', (req, res) => {
  res.send('Secure Forum API (MongoDB) is running');
});

/* =======================
   USER ROUTES
======================= */

// REGISTER
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ msg: 'All fields are required' });

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        msg: 'Password must be 8+ chars with upper, lower, number & symbol'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'User'
    });

    await logAction(user._id, 'User registered', { email });

    res.status(201).json({
      msg: 'User registered',
      user: {
        _id: user._id,
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

// LOGIN
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ msg: 'All fields are required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ msg: 'Invalid credentials' });

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

/* =======================
   POSTS ROUTES
======================= */

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

    await logAction(req.user.id, 'Created post', { postId: post._id });

    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET POSTS
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE POST (ADMIN ONLY)
app.delete('/api/posts/:id', auth, checkRole(['Admin']), async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    await logAction(req.user.id, 'Admin deleted post', { postId: req.params.id });

    res.json({ msg: 'Post deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/* =======================
   COMMENTS ROUTES
======================= */

// CREATE COMMENT
app.post('/api/comments', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content)
      return res.status(400).json({ msg: 'All fields required' });

    const comment = await Comment.create({
      post: postId,
      user: req.user.id,
      content
    });

    await logAction(req.user.id, 'Created comment', {
      commentId: comment._id,
      postId
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// GET COMMENTS FOR A POST
app.get('/api/comments/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username email role')
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

/* =======================
   AUDIT LOGS (ADMIN)
======================= */
app.get('/api/admin/audit-logs', auth, checkRole(['Admin']), async (req, res) => {
  const logs = await AuditLog.find()
    .populate('user', 'username email role')
    .sort({ createdAt: -1 });

  res.json(logs);
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
