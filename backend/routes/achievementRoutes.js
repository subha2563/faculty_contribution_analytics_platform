// backend/routes/achievementRoutes.js
const express = require('express');
const router = express.Router();
const { getAchievements, createAchievement } = require('../controllers/achievementController');

router.route('/')
  .get(getAchievements)
  .post(createAchievement);

module.exports = router;