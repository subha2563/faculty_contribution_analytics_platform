// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, getDepartmentFaculties, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Auto-import protect

router.post('/login', login);
router.get('/faculty', protect, getDepartmentFaculties);
router.get('/me', protect, getMe);

module.exports = router;
