// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// ----------------- Middleware -----------------
app.use(cors());
app.use(bodyParser.json());

// ----------------- Test Routes -----------------
app.get('/', (req, res) => {
    res.send('Secure Forum API is running!');
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ dbTime: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('DB Error');
    }
});

app.get('/test-roles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM roles');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('DB Error: ' + err.message);
    }
});

// ----------------- User Routes -----------------
const saltRounds = 10;

// Register
app.post('/api/users/register', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: 'Request body missing or invalid JSON' });
    }

    const { username, email, password } = req.body;

    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (userCheck.rows.length > 0) return res.status(400).json({ msg: 'Email already exists' });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Default role = User (role_id = 1)
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, email, hashedPassword, 1]
        );

        res.json({ msg: 'User registered', user: newUser.rows[0] });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).send('Server error');
    }
});

// Login
app.post('/api/users/login', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: 'Request body missing or invalid JSON' });
    }

    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (user.rows.length === 0) return res.status(400).json({ msg: 'Invalid credentials' });

        const validPass = await bcrypt.compare(password, user.rows[0].password);
        if (!validPass) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.rows[0].id, role_id: user.rows[0].role_id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ msg: 'Logged in', token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).send('Server error');
    }
});

// ----------------- Posts Routes -----------------
app.post('/api/posts', async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ msg: 'Request body missing or invalid JSON' });
    }

    const { user_id, title, content } = req.body;

    try {
        const newPost = await pool.query(
            'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING *',
            [user_id, title, content]
        );
        res.json(newPost.rows[0]);
    } catch (err) {
        console.error('Create post error:', err);
        res.status(500).send('Server error');
    }
});

app.get('/api/posts', async (req, res) => {
    try {
        const posts = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(posts.rows);
    } catch (err) {
        console.error('Get posts error:', err);
        res.status(500).send('Server error');
    }
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    pool.connect()
        .then(() => console.log('Connected to PostgreSQL'))
        .catch(err => console.error('DB connection error:', err));
});
