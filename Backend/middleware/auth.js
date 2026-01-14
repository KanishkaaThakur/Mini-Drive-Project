const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use environment variable for Render, fallback to string for localhost
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev";

module.exports = async function(req, res, next) {
  // 1. Get token from header
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // 2. Verify Token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. 🔥 FIX: Handle different token structures
    // Your token uses "userId", but sometimes it can be "id". This checks ALL options:
    const userId = decoded.userId || decoded.id || (decoded.user && decoded.user.id);

    if (!userId) {
       console.error("Token payload missing ID:", decoded);
       return res.status(401).json({ message: 'Invalid token structure' });
    }

    // 4. Find User in DB
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // 5. Attach user to request object
    req.user = user;
    next();
    
  } catch (err) {
    console.error("Auth Error:", err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};