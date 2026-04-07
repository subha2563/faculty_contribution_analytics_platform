// src/pages/Contributions.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar'; // 👈 NEW

const Contributions = () => {
  const [myPapers, setMyPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const facultyEmail = localStorage.getItem('facultyEmail');

  useEffect(() => {
    const fetchMyContributions = async () => {
      try {
        const { data } = await axios.get(`https://faculty-contribution-analytics-platform.onrender.com/api/contributions?email=${facultyEmail}`);
        setMyPapers(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching my contributions:", error);
        setLoading(false);
      }
    };

    if (facultyEmail) {
      fetchMyContributions();
    }
  }, [facultyEmail]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        await axios.delete(`https://faculty-contribution-analytics-platform.onrender.com/api/contributions/${id}`);
        setMyPapers(prev => prev.filter(paper => paper._id !== id));
      } catch (error) {
        console.error("Error deleting contribution:", error);
        alert("Failed to delete submission.");
      }
    }
  };

  return (
    <div className="app-layout"> {/* 👈 NEW WRAPPER */}
      <Sidebar />

      <div className="main-wrapper"> {/* 👈 NEW WRAPPER */}
        <Topbar /> {/* 👈 ADDS THE SEARCH BAR & PROFILE */}

        <main className="main-content">
          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>My Portfolio</p>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B' }}>My Publications</h2>
          </div>

          <div className="table-card" style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div style={{ marginBottom: '16px', fontWeight: '600', color: '#1E293B' }}>
              Submission History
            </div>

            {loading ? (
              <p style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>Loading your data...</p>
            ) : (
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#A3AED0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '16px', borderBottom: '1px solid #E9EDF7' }}>Paper Title</th>
                    <th style={{ color: '#A3AED0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '16px', borderBottom: '1px solid #E9EDF7' }}>Type</th>
                    <th style={{ color: '#A3AED0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '16px', borderBottom: '1px solid #E9EDF7' }}>Date Submitted</th>
                    <th style={{ color: '#A3AED0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '16px', borderBottom: '1px solid #E9EDF7' }}>Document</th>
                    <th style={{ color: '#A3AED0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '16px', borderBottom: '1px solid #E9EDF7' }}>Approval Status</th>
                    <th style={{ color: '#A3AED0', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', textAlign: 'left', paddingBottom: '16px', borderBottom: '1px solid #E9EDF7' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myPapers.length > 0 ? (
                    myPapers.map((paper) => (
                      <tr key={paper._id}>
                        <td style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE', fontSize: '14px', color: '#1B2559', fontWeight: '500' }}>{paper.title}</td>
                        <td style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE', fontSize: '14px', color: '#1B2559' }}><span className="type-badge" style={{ backgroundColor: '#F1F5F9', color: '#3B82F6' }}>{paper.type}</span></td>
                        <td style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE', fontSize: '14px', color: '#1B2559' }}>{new Date(paper.date).toLocaleDateString()}</td>

                        <td style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE', fontSize: '14px', color: '#1B2559' }}>
                          {paper.documentPath ? (
                            <a href={`https://faculty-contribution-analytics-platform.onrender.com/uploads/${paper.documentPath}`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'none', fontWeight: '500' }}>
                              📄 View PDF
                            </a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>No File</span>
                          )}
                        </td>

                        <td style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE', fontSize: '14px', color: '#1B2559' }}>
                          <span style={{
                            padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: paper.status === 'Approved' ? '#DCFCE7' : paper.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                            color: paper.status === 'Approved' ? '#16A34A' : paper.status === 'Rejected' ? '#EF4444' : '#D97706'
                          }} title={paper.rejectionReason || ''}>
                            {paper.status}
                          </span>
                          {paper.status === 'Rejected' && paper.rejectionReason && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444', fontWeight: '500', maxWidth: '150px', wordWrap: 'break-word' }}>
                              Reason: {paper.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '16px 0', borderBottom: '1px solid #F4F7FE', fontSize: '14px', color: '#1B2559' }}>
                          <button
                            onClick={() => handleDelete(paper._id)}
                            style={{ color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Delete"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                        You haven't uploaded any contributions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Contributions;