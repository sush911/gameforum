const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const saltRounds = 10;

// Register
router.post('/register', async (req, res) => {
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
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
        if (user.rows.length === 0) return res.status(400).json({ msg: 'Invalid credentials' });

        const validPass = await bcrypt.compare(password, user.rows[0].password);
        if (!validPass) return res.status(400).json({ msg: 'Invalid credentials' });

        const token = jwt.sign({ id: user.rows[0].id, role_id: user.rows[0].role_id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ msg: 'Logged in', token });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
