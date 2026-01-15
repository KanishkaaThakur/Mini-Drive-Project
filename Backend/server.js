
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. MIDDLEWARE
app.use(express.json());
app.use(cors());

// 2. DATABASE
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/minidrive";
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));

// 3. ROUTES (Updated to match your filenames)
app.use('/api/auth', require('./routes/authRoutes')); // <--- FIXED HERE
app.use('/api/files', require('./routes/fileRoutes'));

// 4. ERROR HANDLING
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).send('Something broke!');
});

// 5. START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));