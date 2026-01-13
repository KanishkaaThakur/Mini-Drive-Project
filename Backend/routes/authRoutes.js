const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// --- REGISTER ---
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ email, password: hashedPassword });
    await user.save();

    // INCLUDE ROLE IN TOKEN
    const token = jwt.sign({ userId: user._id, role: user.role }, 'secretKey123', { expiresIn: '1h' });

    res.status(201).json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    // INCLUDE ROLE IN TOKEN
    const token = jwt.sign({ userId: user._id, role: user.role }, 'secretKey123', { expiresIn: '1h' });

    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- CHEAT CODE: MAKE ADMIN ---
// Usage: Send POST request to http://localhost:5000/api/auth/make-admin with {"email": "your_email"}
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
    res.json({ message: `${email} is now an Admin!`, user });
  } catch (error) {
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;