// backend/routes/contributionRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getContributions, createContribution, updateStatus, deleteContribution, getGamificationStats, getHodChartData, getFacultyLeaderboard, getUserDashboardStats, getHodDashboardStats, getMonthlyProgress, getCollegeAverages } = require('../controllers/contributionController');
const { protect } = require('../middleware/authMiddleware');

// 👇 Configure Multer to save files in the 'uploads' folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Saves to the folder we just created
  },
  filename: function (req, file, cb) {
    // Adds a timestamp to the file so names don't clash
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 👇 Notice we added "upload.single('file')" to the POST route!
router.route('/')
  .get(protect, getContributions)
  .post(protect, upload.single('file'), createContribution);

// Analytics Gamification Points Route
router.get('/analytics/points', protect, getGamificationStats);

// Analytics Monthly Progress Route
router.get('/analytics/monthly', protect, getMonthlyProgress);

// User Dashboard Stats Route
router.get('/me/stats', protect, getUserDashboardStats);

// HOD Dashboard specific chart data
router.get('/hod/chart-data', protect, getHodChartData);

// HOD Dashboard Leaderboard
router.get('/hod/leaderboard', protect, getFacultyLeaderboard);

// HOD Dashboard Simple Stats
router.get('/hod/stats', protect, getHodDashboardStats);

// Analytics College Averages Leaderboard
router.get('/analytics/college-averages', protect, getCollegeAverages);

router.route('/:id')
  .put(protect, updateStatus)
  .delete(protect, deleteContribution);

module.exports = router;