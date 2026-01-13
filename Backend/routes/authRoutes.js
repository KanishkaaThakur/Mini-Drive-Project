const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// HARDCODED SECRET
const JWT_SECRET = process.env.JWT_SECRET || "cloudberrySecretKey123";

// REGISTER
router.post('/register', async (req, res) => {
  // 1. EXTRACT 'name' HERE
  const { name, email, password } = req.body; 

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // 2. SAVE 'name' TO DATABASE
   user = new User({ name, email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      // 3. SEND 'name' BACK TO FRONTEND
      res.json({ token, role: user.role, name: user.name }); 
    });
  } catch (err) {
    console.error(err); // Good to see errors in terminal
    res.status(500).send('Server error');
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      // 4. SEND 'name' BACK HERE TOO
      res.json({ token, role: user.role, name: user.name }); 
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// GET USER
router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;