const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
connectDB();

// ----------------- Helpers -----------------
const logAction = async (userId, action, metadata = {}) => {
  try {
    await AuditLog.create({ user: userId, action, metadata });
  } catch (err) {
    console.error('Audit log error:', err);
  }
};

const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ msg: 'Forbidden' });
  next();
};

// ----------------- User Routes -----------------
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ msg: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    await logAction(user._id, 'User registered');

    res.json({
      msg: 'User registered',
      user: { _id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'All fields are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    await logAction(user._id, 'User logged in');

    res.json({ msg: 'Logged in', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ----------------- Posts Routes -----------------
app.post('/api/posts', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ msg: 'All fields required' });

    const post = await Post.create({ user: req.user.id, title, content });
    await logAction(req.user.id, 'Created post', { postId: post._id });

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

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

// ----------------- Comments Routes -----------------
app.post('/api/comments', auth, async (req, res) => {
  try {
    const { postId, content } = req.body;
    if (!postId || !content) return res.status(400).json({ msg: 'All fields required' });

    const comment = await Comment.create({ post: postId, user: req.user.id, content });
    await logAction(req.user.id, 'Created comment', { commentId: comment._id, postId });

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

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

// ----------------- Start Server -----------------
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
