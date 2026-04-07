import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HodSidebar from '../components/HodSidebar';
import Topbar from '../components/Topbar';

const ManageFaculty = () => {
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/auth/faculty');
        setFaculties(data);
      } catch (error) {
        console.error("Error fetching faculties:", error);
      }
    };
    fetchFaculties();
  }, []);

  return (
    <div className="app-layout">
      <HodSidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          <header className="page-header" style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 5px 0', color: 'var(--text-dark)', fontSize: '24px' }}>Manage Faculty</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>View registered faculty members in your department.</p>
          </header>

          <div className="table-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div className="table-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-dark)', fontSize: '18px', margin: '0 0 5px 0' }}>Department Faculty Roster</h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E9EDF7', textAlign: 'left' }}>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Sl No</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Faculty Name</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Email ID</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Department</th>
                  </tr>
                </thead>
                <tbody>
                  {faculties.length > 0 ? (
                    faculties.map((faculty, index) => (
                      <tr key={faculty._id} style={{ borderBottom: '1px solid #F4F7FE' }}>
                        <td style={{ padding: '16px', color: '#1B2559', fontWeight: '500' }}>{index + 1}</td>
                        <td style={{ padding: '16px', color: '#1B2559', fontWeight: '600' }}>{faculty.name}</td>
                        <td style={{ padding: '16px', color: '#475467' }}>{faculty.email}</td>
                        <td style={{ padding: '16px' }}>
                          <span style={{ backgroundColor: '#F4F0FF', color: '#58328B', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                            {faculty.department}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="empty-state" style={{ padding: '30px', textAlign: 'center', color: '#A3AED0' }}>
                        No faculty members have registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ManageFaculty;