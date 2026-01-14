const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isPasswordExpired } = require('../utils/security');

// Verify JWT token and user
module.exports = async (req, res, next) => {
  try {
    console.log('AUTH CHECK:', req.method, req.path);
    
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      console.log('AUTH FAILED: No token provided');
      return res.status(401).json({ msg: 'No token provided' });
    }

    const token = header.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded:', { id: decoded.id, email: decoded.email, role: decoded.role });

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('AUTH FAILED: User not found in database');
      return res.status(401).json({ msg: 'User not found' });
    }
    console.log('User found:', user.email);

    // Check if account is locked
    if (user.lockUntil && new Date() < new Date(user.lockUntil)) {
      console.log('AUTH FAILED: Account locked until', user.lockUntil);
      return res.status(401).json({ msg: 'Account locked. Try again later.' });
    }

    // Check if password expired
    const expired = isPasswordExpired(user);
    console.log('Password expired check:', expired, '| passwordExpiresAt:', user.passwordExpiresAt);
    if (expired) {
      console.log('AUTH FAILED: Password expired');
      return res.status(401).json({ msg: 'Password expired. Please reset it.' });
    }

    console.log('AUTH SUCCESS for', user.email);
    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (err) {
    console.log('AUTH ERROR:', err.message);
    return res.status(401).json({ msg: 'Invalid token' });
  }
};
