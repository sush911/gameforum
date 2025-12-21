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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// ----------------- Test Route -----------------
app.get('/', (req, res) => {
    res.send('Secure Forum API (MongoDB) is running!');
});

// ----------------- User Routes -----------------

// Register
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        // Check existing user
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ msg: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.json({ msg: 'User registered', user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: 'All fields are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ msg: 'Logged in', token });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ----------------- Posts Routes -----------------

// Create post
app.post('/api/posts', async (req, res) => {
    try {
        const { userId, title, content } = req.body;
        if (!userId || !title || !content) return res.status(400).json({ msg: 'All fields required' });

        const post = new Post({ user: userId, title, content });
        await post.save();

        res.json(post);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find().populate('user', 'username email role').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
