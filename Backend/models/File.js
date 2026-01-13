const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId, // Connects to a User ID
    ref: 'User',
    required: true
  },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number }
});

module.exports = mongoose.model('File', fileSchema);