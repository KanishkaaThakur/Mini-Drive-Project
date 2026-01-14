const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Force Secret for Render
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_local_dev";

// ==========================================
// 1. REGISTER USER (The fixed version!)
// ==========================================
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      name,      // Ensure name is saved
      email,
      password
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create Token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        // 🔥 FIX: Send the name back immediately after registering
        res.json({ 
          token, 
          user: {
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ==========================================
// 2. LOGIN USER (The fixed version!)
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) throw err;
        // 🔥 FIX: Send the name back on login too
        res.json({ 
          token, 
          user: {
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ==========================================
// 3. GET USER INFO
// ==========================================
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ==========================================
// 4. MAGIC FIX ROUTE (To fix your Admin)
// ==========================================
router.get('/fix-admin', async (req, res) => {
  try {
    // Finds "adminn@gmail.com" and fixes the name
    const user = await User.findOne({ email: "adminn@gmail.com" });
    if (!user) return res.send("Admin user not found.");
    
    user.name = "Admin";
    user.role = "admin";
    await user.save();
    
    res.send("✅ Admin Fixed! Log out and log back in.");
  } catch (err) {
    res.send("Error: " + err.message);
  }
});

module.exports = router;