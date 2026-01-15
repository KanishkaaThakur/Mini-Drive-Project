const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user' 
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// CRITICAL FIX: Ensure the model name is exactly 'user' (lowercase)
module.exports = mongoose.model('user', UserSchema);