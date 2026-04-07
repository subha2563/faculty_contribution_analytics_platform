// backend/server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const contributionRoutes = require('./routes/contributionRoutes');


dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
// Add this near the top with your other requires
const path = require('path');
const helmet = require('helmet');

// Add this below your app.use(cors()) and app.use(express.json())
app.use(helmet());

// Add this below your app.use(cors()) and app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors({ origin: '*' })); // Allows frontend to talk to backend
app.use(express.json()); // Parses JSON data from requests

// ... inside middleware (app.use...)
app.use('/api/contributions', contributionRoutes);
app.use('/api/achievements', require('./routes/achievementRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));

// ------------------------------------------------------------------
// 1. Basic Route (To test if server is working)
// ------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send('API is Running Successfully! 🚀');
});

//---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});