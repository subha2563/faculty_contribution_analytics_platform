// src/components/Topbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Topbar = () => {
  const navigate = useNavigate();

  return (
    <header className="topbar" style={{ padding: '20px 30px', boxSizing: 'border-box', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="search-bar">
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="#A3AED0" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" placeholder="Search publications, authors, or topics..." />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <svg viewBox="0 0 24 24" width="22" height="22" stroke="#A3AED0" strokeWidth="2" fill="none" style={{ cursor: 'pointer' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <button onClick={() => navigate('/upload')} className="primary-btn">
          New Submission
        </button>
      </div>
    </header>
  );
};

export default Topbar;