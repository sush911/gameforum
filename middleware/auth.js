const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

app.post('/api/users/enable-mfa', auth, async (req, res) => {
  req.userDoc.mfa_enabled = true;
  await req.userDoc.save();

  await logAction(req.user.id, 'MFA enabled');

  res.json({ msg: 'MFA enabled successfully' });
});
