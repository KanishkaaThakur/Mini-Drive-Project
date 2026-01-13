const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <--- This is the key
require('dotenv').config();

const app = express();

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors()); // <--- ALLOWS FRONTEND TO TALK TO BACKEND

// --- CONNECT TO MONGODB ---
// (We use a hardcoded string if dotenv fails, to be safe)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/minidrive';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.log('❌ DB Error:', err));

// --- ROUTES ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on Port ${PORT}`));