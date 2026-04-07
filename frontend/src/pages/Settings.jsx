// src/pages/Settings.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import './Dashboard.css'; // Reusing dashboard styles for consistency

const Settings = () => {
  // Grab the real data from Google login that we saved in memory!
  const facultyName = localStorage.getItem('facultyName') || 'Unknown User';
  const facultyEmail = localStorage.getItem('facultyEmail') || 'No Email Provided';
  const role = localStorage.getItem('role') || 'Faculty';

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <h2>Account Settings</h2>
          <p>Manage your profile and portal preferences.</p>
        </header>

        <div className="upload-card" style={{ maxWidth: '600px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
            {/* Cool generated avatar based on the first letter of your name */}
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#3498db', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '32px', fontWeight: 'bold' }}>
              {facultyName.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '24px', color: '#2c3e50' }}>{facultyName}</h3>
              <p style={{ margin: '5px 0 0 0', color: '#7f8c8d' }}>{role} • Computer Science Dept.</p>
            </div>
          </div>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={facultyName} disabled style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }} />
              <small style={{ color: '#95a5a6' }}>Synced with Google Workspace</small>
            </div>

            <div className="form-group">
              <label>College Email Address</label>
              <input type="email" value={facultyEmail} disabled style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }} />
            </div>

            <button type="button" className="submit-btn" style={{ backgroundColor: '#95a5a6', marginTop: '10px' }} disabled>
              Update Profile (Locked by Admin)
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Settings;