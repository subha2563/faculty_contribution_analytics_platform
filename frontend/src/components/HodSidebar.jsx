// src/components/HodSidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import './Sidebar.css';

const HodSidebar = ({ onExport }) => {
    const navigate = useNavigate();
    const name = localStorage.getItem('facultyName') || 'Head of Department';
    const dept = localStorage.getItem('department') || 'Computer Science';

    return (
        <aside className="sidebar">
            {/* Brand */}
            <div className="sidebar-brand" style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <img src={logo} alt="College Logo" style={{ maxWidth: '180px', maxHeight: '70px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/hod-dashboard" className="nav-item" end>
                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Dept Overview
                </NavLink>
                <NavLink to="/manage-faculty" className="nav-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Manage Faculty
                </NavLink>
                {onExport && (
                    <a href="#" className="nav-item" onClick={(e) => { e.preventDefault(); onExport(); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Generate Reports
                    </a>
                )}
            </nav>

            {/* Profile Widget Bottom */}
            <div className="profile-widget">
                <div className="profile-avatar">{name.charAt(0)}</div>
                <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dept}</p>
                </div>
            </div>

            <button onClick={() => { localStorage.clear(); navigate('/'); }} className="logout-btn" style={{ marginTop: 'auto' }}>
                <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Log out
            </button>
        </aside>
    );
};

export default HodSidebar;
