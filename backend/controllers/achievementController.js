// backend/controllers/achievementController.js
const Achievement = require('../models/Achievement');

// Fetch all achievements
const getAchievements = async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create a new achievement
const createAchievement = async (req, res) => {
  try {
    const newAchievement = new Achievement(req.body);
    const savedAchievement = await newAchievement.save();
    res.json(savedAchievement);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getAchievements, createAchievement };