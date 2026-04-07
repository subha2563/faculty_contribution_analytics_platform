// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Achievements from './pages/Achievements';
import Settings from './pages/Settings';
import HodDashboard from './pages/HodDashboard';
import ManageFaculty from './pages/ManageFaculty';

// NOTE: If your "My Contributions" file is named differently (e.g., Contributions.jsx), import it here!
import Contributions from './pages/Contributions';
import Instructions from './pages/Instructions';
import axios from 'axios';

// Preserve token on refresh
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        {/* Faculty Routes */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contributions" element={<Contributions />} /> {/* Make sure this matches your file name! */}
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/instructions" element={<Instructions />} />

        {/* HOD Routes */}
        <Route path="/hod-dashboard" element={<HodDashboard />} />
        <Route path="/manage-faculty" element={<ManageFaculty />} />
      </Routes>
    </Router>
  );
}

export default App;