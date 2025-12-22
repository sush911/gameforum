const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isPasswordExpired } = require('../utils/security');

// Verify JWT token and user
module.exports = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ msg: 'No token provided' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user)
      return res.status(401).json({ msg: 'User not found' });

    // Check if account is locked
    if (user.lockUntil && new Date() < new Date(user.lockUntil))
      return res.status(401).json({ msg: 'Account locked. Try again later.' });

    // Check if password expired
    if (isPasswordExpired(user))
      return res.status(401).json({ msg: 'Password expired. Please reset it.' });

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};
