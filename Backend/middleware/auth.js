const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, 'secretKey123'); // Must match the secret in authRoutes
    req.user = decoded; // Add user info to the request
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};