const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String },
  size: { type: Number },
  date: { type: Date, default: Date.now },
  // ADD THIS LINE BELOW:
  isPublic: { type: Boolean, default: false } 
});

module.exports = mongoose.model('File', FileSchema);