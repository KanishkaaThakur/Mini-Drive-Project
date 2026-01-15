const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  // --- NEW FIELD: This holds the list of invited emails ---
  sharedWith: [{
    type: String
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('file', FileSchema);