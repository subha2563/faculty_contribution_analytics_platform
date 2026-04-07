// src/pages/Achievements.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import './Achievements.css';

const Achievements = () => {
  const [contributions, setContributions] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const facultyEmail = localStorage.getItem('facultyEmail');
        const res = await axios.get(`https://faculty-contribution-analytics-platform.onrender.com/api/contributions?email=${facultyEmail}`);
        setContributions(res.data);

        const calculatedLivePoints = res.data
          .filter(paper => paper.status === 'Approved')
          .reduce((sum, paper) => sum + (Number(paper.pointsEarned) || 0), 0);
        setTotalPoints(calculatedLivePoints);
      } catch (error) {
        console.error("Error fetching achievements data:", error);
      }
    };
    fetchData();
  }, []);

  const achievements = [
    { id: 1, title: "First Blood", desc: "Submit your first contribution", icon: "🚀", isUnlocked: contributions.length > 0 },
    { id: 2, title: "HOD Approved", desc: "Get your first approval", icon: "✅", isUnlocked: contributions.some(p => p.status === 'Approved') },
    { id: 3, title: "API Century", desc: "Reach 100 total API points", icon: "💯", isUnlocked: totalPoints >= 100 },
    { id: 4, title: "Journal Giant", desc: "Get 3 Journals approved", icon: "📚", isUnlocked: contributions.filter(p => p.type === 'Journal' && p.status === 'Approved').length >= 3 }
  ];

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-content">
            <div>
              <h2>Performance & Achievements</h2>
              <p>Highlighting professional milestones and recognitions.</p>
            </div>
          </div>
        </header>

        <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {achievements.map((item) => (
            <div key={item.id} style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              filter: item.isUnlocked ? 'none' : 'grayscale(1)',
              opacity: item.isUnlocked ? 1 : 0.5,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>{item.icon}</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#2B3674', fontSize: '18px' }}>{item.title}</h3>
              <p style={{ margin: '0 0 15px 0', color: '#A3AED0', fontSize: '14px' }}>{item.desc}</p>
              {item.isUnlocked ? (
                <span style={{ backgroundColor: '#E0F8EF', color: '#01B574', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  UNLOCKED
                </span>
              ) : (
                <span style={{ backgroundColor: '#F4F7FE', color: '#A3AED0', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  LOCKED
                </span>
              )}
            </div>
          ))}
        </div>

      </main>
    </div>
  );
};

export default Achievements;