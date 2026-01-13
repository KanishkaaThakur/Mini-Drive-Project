const jwt = require('jsonwebtoken');
const User = require('../models/User');

// HARDCODED SECRET for stability
const JWT_SECRET = process.env.JWT_SECRET || "cloudberrySecretKey123";

module.exports = async function(req, res, next) {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify using the SAME secret
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const userId = decoded.user ? decoded.user.id : decoded.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Error:", err.message); // Look at terminal for this
    res.status(401).json({ message: 'Token is not valid' });
  }
};