// backend/models/Achievement.js
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true }, // Award, Patent, Certification, Recognition
  date: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '🏆' }
});

module.exports = mongoose.model('Achievement', achievementSchema);