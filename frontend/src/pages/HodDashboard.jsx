import React, { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, Line, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import logo from '../assets/logo.png';
import './HodDashboard.css';
import HodSidebar from '../components/HodSidebar';
import Topbar from '../components/Topbar';

const HodDashboard = () => {
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [totalStats, setTotalStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [deptStats, setDeptStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [totalFaculty, setTotalFaculty] = useState(0);

  const [statusData, setStatusData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [collegeLeaderboard, setCollegeLeaderboard] = useState([]);

  const [multipliers, setMultipliers] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  const COLORS = ['#2ecc71', '#f39c12', '#e74c3c'];

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      const dept = localStorage.getItem('department') || 'CSE';
      const { data } = await axios.get(`http://localhost:5000/api/contributions?role=HOD&department=${dept}`);
      setAllSubmissions(data);

      const pending = data.filter(item => item.status === 'Pending');
      const approved = data.filter(item => item.status === 'Approved');
      const rejected = data.filter(item => item.status === 'Rejected');

      setPendingSubmissions(pending);
      setTotalStats({ total: data.length, pending: pending.length, approved: approved.length });

      setStatusData([
        { name: 'Approved', value: approved.length },
        { name: 'Pending', value: pending.length },
        { name: 'Rejected', value: rejected.length }
      ].filter(item => item.value > 0));


      const typeCounts = data.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {});

      // Fetch ComposedChart Data
      try {
        const chartRes = await axios.get(`http://localhost:5000/api/contributions/hod/chart-data`);
        setChartData(chartRes.data || []);
      } catch (chartError) {
        console.error("Error fetching HOD chart:", chartError);
      }

      // Fetch Leaderboard Data
      try {
        const leaderboardRes = await axios.get(`http://localhost:5000/api/contributions/hod/leaderboard`);
        setLeaderboard(leaderboardRes.data || []);
      } catch (leaderboardError) {
        console.error("Error fetching HOD leaderboard:", leaderboardError);
      }

      // Fetch College-Wide Leaderboard Data
      try {
        const collegeRes = await axios.get(`http://localhost:5000/api/contributions/analytics/college-averages`);
        setCollegeLeaderboard(collegeRes.data || []);
      } catch (collegeError) {
        console.error("Error fetching College averages:", collegeError);
      }

      // Fetch Department Basic Stats
      try {
        const statsRes = await axios.get(`http://localhost:5000/api/contributions/hod/stats`);
        setDeptStats(statsRes.data);
      } catch (statsError) {
        console.error("Error fetching HOD stats:", statsError);
      }

      // Fetch Total Registered Faculty
      try {
        const facultyRes = await axios.get(`http://localhost:5000/api/auth/faculty`);
        setTotalFaculty(facultyRes.data.length);
      } catch (facultyError) {
        console.error("Error fetching total faculty count:", facultyError);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    let rejectionReason = "";
    if (newStatus === 'Rejected') {
      rejectionReason = window.prompt("Please enter a reason for rejection (required for NBA audits):");
      if (rejectionReason === null || rejectionReason.trim() === "") {
        return; // Cancel or empty
      }
    }

    try {
      // Get the locally selected multiplier or default to 1.0 (Tier 2)
      const selectedMultiplier = multipliers[id] || 1.0;

      // Optimistic UI Update for instant feedback
      setAllSubmissions(prev =>
        prev.map(sub => sub._id === id ? { ...sub, status: newStatus } : sub)
      );
      setPendingSubmissions(prev =>
        prev.filter(sub => sub._id !== id)
      );

      await axios.put(`http://localhost:5000/api/contributions/${id}`, { status: newStatus, multiplier: selectedMultiplier, rejectionReason });
      fetchData(); // Refresh stats and charts silently in the background
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
      fetchData(); // Revert on failure
    }
  };

  const exportToCSV = () => {
    if (allSubmissions.length === 0) return alert("No data available.");
    const headers = ["Faculty,Title,Type,Date,Status\n"];
    const rows = allSubmissions.map(sub =>
      `"${sub.facultyName || 'Unknown'}","${sub.title}","${sub.type}","${new Date(sub.date).toLocaleDateString()}","${sub.status}"\n`
    );
    const blob = new Blob([headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "Department_Contributions.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deptData = allSubmissions || [];

  // --- 1. DYNAMIC FUNNEL DATA (Approval Pipeline) ---
  const totalSubmitted = deptData.length;
  const pendingReview = deptData.filter(p => p.status === 'Pending').length;
  const approvedDocs = deptData.filter(p => p.status === 'Approved').length;

  const funnelData = [
    { name: 'Total Submitted', value: totalSubmitted, fill: '#4318FF' },
    { name: 'Pending Review', value: pendingReview, fill: '#FFB547' },
    { name: 'Approved', value: approvedDocs, fill: '#01B574' }
  ];

  // --- 2. DYNAMIC STACKED BAR DATA (Quality Breakdown by Type) ---
  // Group papers by Type (Journal, Conference, etc.) and count how many are Tier 1, 2, or 3.
  const qualityMap = deptData.reduce((acc, paper) => {
    if (paper.status === 'Approved') {
      const type = paper.type || 'Other';
      const tier = paper.tier || 'Tier 2'; // Fallback if tier not set
      
      if (!acc[type]) acc[type] = { type, 'Tier 1': 0, 'Tier 2': 0, 'Tier 3': 0 };
      if (tier.includes('1')) acc[type]['Tier 1'] += 1;
      else if (tier.includes('3')) acc[type]['Tier 3'] += 1;
      else acc[type]['Tier 2'] += 1;
    }
    return acc;
  }, {});

  const stackedData = Object.values(qualityMap);

  // Structure for College-Wide Leaderboard
  // Note: 'CSE' will be dynamically matched against the logged-in HOD's department later.
  const currentHodDept = localStorage.getItem('department') || 'CSE'; 

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    
    // Fallback for data
    const deptData = allSubmissions || []; 
    const totalApproved = deptData.filter(p => p.status === 'Approved').length;

    // 1. Official Document Header
    doc.setFontSize(18);
    doc.setTextColor(43, 54, 116); // Brand Dark Blue
    doc.text('Bannari Amman Institute of Technology', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text('Department NBA Audit Report', 14, 30);
    
    // 2. Summary Metrics
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text(`Department: CSE`, 14, 40);
    doc.text(`Date Generated: ${currentDate}`, 14, 46);
    doc.text(`Total Submissions: ${deptData.length}`, 150, 40);
    doc.text(`Approved Publications: ${totalApproved}`, 150, 46);

    // 3. Map the Table Data
    const tableColumn = ["Faculty Name", "Paper Title", "Type", "Tier", "Status", "Points"];
    const tableRows = [];

    deptData.forEach(paper => {
      const rowData = [
        paper.facultyName || paper.user?.name || 'N/A',
        paper.paperTitle || paper.title || 'N/A',
        paper.type || 'N/A',
        paper.tier || 'N/A',
        paper.status || 'Pending',
        paper.pointsAwarded || paper.points || 0
      ];
      tableRows.push(rowData);
    });

    // 4. Generate the AutoTable
    autoTable(doc, {
      startY: 55,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [67, 24, 255] }, // Purple Header
      alternateRowStyles: { fillColor: [244, 247, 254] }, // Light Grey rows
      styles: { fontSize: 10, cellPadding: 4 },
    });

    // 5. Save the PDF
    doc.save(`CSE_NBA_Audit_Report_${currentDate.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="app-layout">
      <HodSidebar onExport={exportToCSV} />

      <div className="main-wrapper">
        <Topbar />

        <main className="main-content">
          <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <h2 style={{ margin: 0, color: '#2B3674', fontSize: '24px' }}>{localStorage.getItem('department')} Department Overview</h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '5px' }}>Welcome, Head of Department. Live monitoring is active.</p>
            </div>
            <button 
              onClick={handleDownloadPDF}
              style={{
                background: '#4318FF', color: '#fff', border: 'none', padding: '10px 20px', 
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', 
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
              </svg>
              Generate NBA Report
            </button>
          </header>

          <div className="stats-grid">
            <div className="stat-card"><h3>Total Faculty</h3><p className="stat-number">{totalFaculty}</p></div>
            <div className="stat-card"><h3>Total Publications</h3><p className="stat-number">{deptStats.total}</p></div>
            <div className="stat-card"><h3>Pending Approvals</h3><p className="stat-number alert">{deptStats.pending}</p></div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '30px 0' }}>
            {/* PIPELINE FUNNEL CHART */}
            <div style={{ flex: '1', minWidth: '300px', padding: '20px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#2B3674', marginBottom: '15px' }}>Department Pipeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Tooltip />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#A3AED0" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>

            {/* QUALITY MULTIPLIER STACKED BAR */}
            <div style={{ flex: '2', minWidth: '400px', padding: '20px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#2B3674', marginBottom: '15px' }}>Quality Distribution (Approved)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stackedData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <XAxis dataKey="type" tick={{ fill: '#A3AED0' }} />
                  <YAxis tick={{ fill: '#A3AED0' }} />
                  <Tooltip cursor={{ fill: '#F4F7FE' }} />
                  <Legend />
                  <Bar dataKey="Tier 1" stackId="a" fill="#4318FF" name="High Impact (1.5x)" />
                  <Bar dataKey="Tier 2" stackId="a" fill="#6AD2FF" name="Standard (1.0x)" />
                  <Bar dataKey="Tier 3" stackId="a" fill="#E2E8F0" name="Basic (0.5x)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LIVE COLLEGE LEADERBOARD CARD */}
            <div style={{ flex: '1', minWidth: '350px', padding: '20px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#2B3674', margin: 0 }}>College Average Leaderboard</h3>
                <span style={{ fontSize: '12px', color: '#01B574', fontWeight: 'bold', background: '#E6F8EF', padding: '4px 8px', borderRadius: '8px' }}>Live Data</span>
              </div>
              
              <ResponsiveContainer width="100%" height={280}>
                <BarChart layout="vertical" data={collegeLeaderboard} margin={{ top: 10, right: 40, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="department" tick={{ fill: '#2B3674', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`${value} pts avg`, 'Average']} />
                  
                  <Bar dataKey="avgPoints" radius={[0, 4, 4, 0]} barSize={25}>
                    {collegeLeaderboard.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.department === currentHodDept ? '#4318FF' : '#E2E8F0'} 
                      />
                    ))}
                    <LabelList dataKey="avgPoints" position="right" fill="#A3AED0" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="table-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <div className="table-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ color: 'var(--text-dark)', fontSize: '18px', margin: '0 0 5px 0' }}>Department Submissions</h3>
                <span style={{ fontSize: '12px', color: '#A3AED0' }}>Live updates enabled. Click faculty name for deep dive.</span>
              </div>
              <input 
                type="text" 
                placeholder="Search by faculty name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '8px', minWidth: '250px', outline: 'none' }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E9EDF7', textAlign: 'left' }}>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Faculty Name</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Paper Title</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Type</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Document</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Approval Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubmissions.filter(sub => 
                    (sub.facultyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                    (sub.facultyEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                  ).length > 0 ? (
                    allSubmissions
                      .filter(sub => 
                        (sub.facultyName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                        (sub.facultyEmail?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                      )
                      .map((sub) => (
                      <tr key={sub._id} style={{ borderBottom: '1px solid #F4F7FE' }}>
                        <td style={{ padding: '16px' }}>
                          <div 
                            onClick={() => setSelectedFaculty({ email: sub.facultyEmail, name: sub.facultyName })}
                            style={{ fontWeight: '600', color: '#4318FF', cursor: 'pointer', textDecoration: 'underline', display: 'inline-block', marginBottom: sub.coAuthors && sub.coAuthors.length > 0 ? '8px' : '0' }}
                          >
                            {sub.facultyName || "Test User"} <span style={{ fontSize: '11px', color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none', marginLeft: '4px', display: 'inline-block' }}>(Primary: {sub.primaryAuthorPercentage || 100}%)</span>
                          </div>
                          {sub.coAuthors && sub.coAuthors.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {sub.coAuthors.map((ca, idx) => (ca.name && (
                                <span key={idx} style={{ fontSize: '11px', backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #E0E7FF' }}>
                                  {ca.name} ({ca.percentage}%)
                                </span>
                              )))}
                            </div>
                          )}
                        </td>
                        <td className="title-col" style={{ padding: '16px', color: '#475467' }}>{sub.title}</td>
                        <td style={{ padding: '16px' }}><span className="type-badge" style={{ backgroundColor: '#F4F0FF', color: '#58328B', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{sub.type}</span></td>
                        <td style={{ padding: '16px' }}>
                          {sub.documentPath ? (
                            <a
                              href={`http://localhost:5000/uploads/${sub.documentPath}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#0d6efd', textDecoration: 'none', fontWeight: '500' }}
                            >
                              View PDF
                            </a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>No File</span>
                          )}
                        </td>
                        <td style={{ padding: '16px' }}>
                          {sub.status === 'Pending' ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select
                                value={multipliers[sub._id] || 1.0}
                                onChange={(e) => setMultipliers({ ...multipliers, [sub._id]: parseFloat(e.target.value) })}
                                style={{ padding: '6px', borderRadius: '6px', border: '1px solid #E9EDF7', fontSize: '12px', color: '#475467', cursor: 'pointer', outline: 'none' }}
                              >
                                <option value={1.5}>Tier 1 (1.5x)</option>
                                <option value={1.0}>Tier 2 (1.0x)</option>
                                <option value={0.5}>Tier 3 (0.5x)</option>
                              </select>
                              <button
                                onClick={() => handleUpdateStatus(sub._id, 'Approved')}
                                style={{ padding: '6px 14px', backgroundColor: '#DCFCE7', color: '#16A34A', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#bbf7d0'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#DCFCE7'}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(sub._id, 'Rejected')}
                                style={{ padding: '6px 14px', backgroundColor: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#fecaca'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: sub.status === 'Approved' ? '#DCFCE7' : '#FEE2E2',
                              color: sub.status === 'Approved' ? '#16A34A' : '#EF4444',
                              display: 'inline-block'
                            }} title={sub.rejectionReason || ''}>
                              {sub.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state" style={{ padding: '30px', textAlign: 'center', color: '#A3AED0' }}>No submissions found matching search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginTop: '30px' }}>
            <div className="table-header" style={{ marginBottom: '20px' }}>
              <h3 style={{ color: 'var(--text-dark)', fontSize: '18px', margin: '0 0 5px 0' }}>🏆 Top 3 Performers</h3>
              <span style={{ fontSize: '12px', color: '#A3AED0' }}>Overall ranking by total performance points</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E9EDF7', textAlign: 'left' }}>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Rank</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Faculty Name</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500' }}>Department</th>
                    <th style={{ padding: '16px', color: '#A3AED0', fontWeight: '500', textAlign: 'right' }}>Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length > 0 ? (
                    leaderboard.slice(0, 3).map((faculty, index) => (
                      <tr key={faculty._id} style={{ borderBottom: '1px solid #F4F7FE' }}>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#1B2559' }}>
                          {index === 0 ? '🏆 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `${index + 1}`}
                        </td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#1B2559' }}>{faculty.name || "Unknown Faculty"}</td>
                        <td style={{ padding: '16px', color: '#475467' }}>{faculty.dept}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <span style={{ backgroundColor: '#E0F8EF', color: '#01B574', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                            {faculty.totalPoints} pts
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="empty-state" style={{ padding: '30px', textAlign: 'center', color: '#A3AED0' }}>
                        No approved points yet for this department.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedFaculty && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
              <div style={{ background: '#fff', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '1000px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '15px' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#1E293B', fontSize: '22px' }}>Publications by {selectedFaculty.name}</h3>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '14px', marginTop: '4px' }}>{selectedFaculty.email}</p>
                  </div>
                  <button onClick={() => setSelectedFaculty(null)} style={{ background: '#F1F5F9', border: 'none', color: '#64748B', fontSize: '20px', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>×</button>
                </div>
                
                <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E9EDF7', textAlign: 'left', backgroundColor: '#F8FAFC' }}>
                      <th style={{ padding: '16px', color: '#64748B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paper Title</th>
                      <th style={{ padding: '16px', color: '#64748B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                      <th style={{ padding: '16px', color: '#64748B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Credential ID</th>
                      <th style={{ padding: '16px', color: '#64748B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Co-Authors</th>
                      <th style={{ padding: '16px', color: '#64748B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status / Reason</th>
                      <th style={{ padding: '16px', color: '#64748B', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSubmissions
                      .filter(s => s.facultyEmail === selectedFaculty.email)
                      .map(sub => (
                      <tr key={sub._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '16px', color: '#334155', fontWeight: '500' }}>{sub.title}</td>
                        <td style={{ padding: '16px' }}><span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{sub.type}</span></td>
                        <td style={{ padding: '16px', color: '#64748B', fontSize: '14px', fontFamily: 'monospace' }}>{sub.credentialId || 'N/A'}</td>
                        <td style={{ padding: '16px', color: '#64748B', fontSize: '14px' }}>
                          {sub.coAuthors && sub.coAuthors.length > 0 
                            ? sub.coAuthors.map(c => `${c.name} (${c.percentage}%)`).join(', ') 
                            : 'None'}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: sub.status === 'Approved' ? '#DCFCE7' : sub.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                            color: sub.status === 'Approved' ? '#16A34A' : sub.status === 'Rejected' ? '#DC2626' : '#D97706',
                          }}>
                            {sub.status}
                          </span>
                          {sub.status === 'Rejected' && sub.rejectionReason && (
                            <div style={{ marginTop: '4px', fontSize: '12px', color: '#DC2626' }}>Reason: {sub.rejectionReason}</div>
                          )}
                        </td>
                        <td style={{ padding: '16px', fontWeight: 'bold', color: '#10B981' }}>{sub.pointsAwarded || 0}</td>
                      </tr>
                    ))}
                    {allSubmissions.filter(s => s.facultyEmail === selectedFaculty.email).length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94A3B8' }}>No submissions found for this user.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default HodDashboard;