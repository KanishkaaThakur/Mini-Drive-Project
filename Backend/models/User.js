const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true // No two users can have the same email
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user', // Default role is 'user', but we can change it to 'admin'
    enum: ['user', 'admin']
  }
});

module.exports = mongoose.model('User', userSchema);