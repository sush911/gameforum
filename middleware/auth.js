const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ msg: 'No token provided' });

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    req.userDoc = await User.findById(decoded.id);

    if (!req.userDoc)
      return res.status(401).json({ msg: 'User not found' });

    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid token' });
  }
};
