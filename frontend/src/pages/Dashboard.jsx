// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import './Dashboard.css';
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, monthlyData: [] });
  // const [statusData, setStatusData] = useState([]);
  // const [typeData, setTypeData] = useState([]);
  const [contributions, setContributions] = useState([]);

  const [gamification, setGamification] = useState({
    userTotal: 0,
    departmentAverage: 0,
    history: []
  });
  const [cumulativeData, setCumulativeData] = useState([]);

  // Match the screenshot colors exactly
  // const COLORS = ['#58328B', '#FFCE20'];

  const facultyEmail = localStorage.getItem('facultyEmail');

  const pointDifference = (gamification.userTotal - gamification.departmentAverage).toFixed(1);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get(`https://faculty-contribution-analytics-platform.onrender.com/api/contributions?email=${facultyEmail}`);
        setContributions(data);

        const approvedCount = data.filter(paper => paper.status === 'Approved').length;
        const pendingCount = data.filter(paper => paper.status === 'Pending').length;

        try {
          const statsRes = await axios.get('https://faculty-contribution-analytics-platform.onrender.com/api/contributions/me/stats');
          setStats(statsRes.data);
        } catch (statsError) {
          console.error("Error fetching me/stats:", statsError);
          // Fallback if endpoint fails
          setStats({ total: data.length, approved: approvedCount, pending: pendingCount, monthlyData: [] });
        }

        // Gamification Fetch
        try {
          const pointsRes = await axios.get('https://faculty-contribution-analytics-platform.onrender.com/api/contributions/analytics/points', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          
          let trueUserPoints = pointsRes.data.userTotal;
          // 🚨 DYNAMIC SYNC: Calculate points using the exact DB field 'pointsEarned'
          const calculatedLivePoints = data
            .filter(paper => paper.status === 'Approved')
            .reduce((sum, paper) => sum + (Number(paper.pointsEarned) || 0), 0);
          
          trueUserPoints = calculatedLivePoints > 0 ? calculatedLivePoints : trueUserPoints;

          setGamification({
            userTotal: trueUserPoints,
            departmentAverage: pointsRes.data.departmentAverage,
            history: pointsRes.data.history || []
          });

          const monthlyRes = await axios.get('https://faculty-contribution-analytics-platform.onrender.com/api/contributions/analytics/monthly', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const backendData = monthlyRes.data || [];

          let cumulativeUser = 0;
          let cumulativeDept = 0;
          const formattedChartData = allMonths.map(monthName => {
            const monthData = backendData.find(d => d.month === monthName);
            if (monthData) {
              cumulativeUser += monthData.userPoints || 0;
              cumulativeDept += monthData.deptTotal || 0;
            }
            return {
              month: monthName,
              userCumulative: cumulativeUser,
              deptCumulative: cumulativeDept
            };
          });
          setCumulativeData(backendData.length === 0 ? [] : formattedChartData);
        } catch (gamificationError) {
          console.error("Error fetching gamification stats:", gamificationError);
        }

        // setStatusData([
        //   { name: 'Approved', value: approvedCount },
        //   { name: 'Pending', value: pendingCount }
        // ]);

        const typeCounts = data.reduce((acc, curr) => {
          acc[curr.type] = (acc[curr.type] || 0) + 1;
          return acc;
        }, {});

        // setTypeData(Object.keys(typeCounts).map(key => ({ name: key, count: typeCounts[key] })));
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };
    if (facultyEmail) fetchStats();
  }, [facultyEmail]);

  useEffect(() => {
    if (!gamification.history) return;

    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let runningTotal = 0;

    const dynamicData = allMonths.map((monthStr, index) => {
      // 1. Filter approved papers for this specific month
      const papersThisMonth = gamification.history.filter(paper => {
        // history already contains approved by backend, but we can verify
        const paperDate = new Date(paper.createdAt || paper.date);
        return paperDate.getMonth() === index;
      });

      // 2. Sum up the points awarded this month
      const pointsThisMonth = papersThisMonth.reduce((sum, paper) => {
        return sum + (Number(paper.pointsAwarded) || Number(paper.points) || 0);
      }, 0);

      // 3. Add to the cumulative total
      runningTotal += pointsThisMonth;
      return {
        month: monthStr,
        yourPoints: runningTotal,
        deptAverage: 0 // Dynamic dept average can be added later
      };
    });

    // Set the dynamically generated array to the chart's state
    setCumulativeData(dynamicData);
  }, [gamification.history]);

  const getLiveCount = (typeStr) => {
    return contributions.filter(paper => 
      paper.status === 'Approved' && 
      (paper.type === typeStr || paper.type === typeStr + 's')
    ).length;
  };

  const comparisonData = [
    { category: 'Journals', yourCount: getLiveCount('Journal'), deptAverage: 3.5 },
    { category: 'Conferences', yourCount: getLiveCount('Conference'), deptAverage: 4.2 },
    { category: 'Patents', yourCount: getLiveCount('Patent'), deptAverage: 1.1 },
    { category: 'Book Chapters', yourCount: getLiveCount('Book Chapter'), deptAverage: 1.8 }
  ];

  // Safe fallback if data isn't loaded yet
  const realData = contributions || []; 

  // --- 1. DYNAMIC DONUT CHART DATA (Categorical Breakdown) ---
  const dynamicTypeCounts = realData.reduce((acc, paper) => {
    if (paper.status === 'Approved') {
      const type = paper.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {});

  const dynamicDonutData = Object.keys(dynamicTypeCounts).map(key => ({
    name: key,
    value: dynamicTypeCounts[key]
  }));

  // --- 2. DYNAMIC AREA CHART DATA (Monthly Progress) ---
  const allMonthsDynamic = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentRunningTotal = 0;
  const dynamicAreaData = allMonthsDynamic.map((monthStr, index) => {
    const monthPoints = realData
      .filter(paper => paper.status === 'Approved' && new Date(paper.createdAt || paper.date).getMonth() === index)
      .reduce((sum, paper) => sum + (Number(paper.pointsAwarded) || Number(paper.points) || 0), 0);
      
    currentRunningTotal += monthPoints;
    return { month: monthStr, cumulativePoints: currentRunningTotal };
  });

  // Colors for the Donut Chart
  const DONUT_COLORS = ['#4318FF', '#6AD2FF', '#01B574', '#FFB547'];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />

        <main className="main-content">
          {/* API SCORE WIDGET (Direct Render) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#A3AED0', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Total API Score Earned
            </h3>
            
            {/* 🚨 BULLETPROOF MATH: Calculated directly from the approved papers array */}
            <div style={{ fontSize: '48px', fontWeight: '800', color: '#4318FF', lineHeight: '1' }}>
              {contributions
                .filter(paper => paper.status === 'Approved')
                .reduce((sum, paper) => sum + (Number(paper.pointsAwarded) || Number(paper.points) || Number(paper.pointsEarned) || 0), 0)}
            </div>
            
            <div style={{ marginTop: '10px', backgroundColor: '#E0F8EF', color: '#01B574', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
              Verified by HOD
            </div>
          </div>

          {/* Points Earnings Ledger (Activity) */}
          <div style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            marginBottom: '20px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2B3674', fontSize: '18px' }}>
              Submission & Review History
            </h3>

            {contributions && contributions.filter(p => p.status === 'Approved' || p.status === 'Rejected').length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {contributions
                  .filter(paper => paper.status === 'Approved' || paper.status === 'Rejected')
                  .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
                  .map((item, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '15px',
                    borderBottom: '1px solid #E9EDF7'
                  }}>
                    <div>
                      <div style={{ color: '#2B3674', fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>
                        {item.title}
                      </div>
                      <div style={{ color: '#A3AED0', fontSize: '13px' }}>
                        {item.type}
                      </div>
                    </div>
                    
                    {/* Conditional Badge Rendering based on Status */}
                    {item.status === 'Approved' ? (
                        <div style={{
                          backgroundColor: '#E0F8EF',
                          color: '#01B574',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          Approved (+{item.pointsAwarded || item.points || 0} pts)
                        </div>
                    ) : (
                        <div style={{
                          backgroundColor: '#FFEBE9',
                          color: '#D32F2F',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          Rejected
                        </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#A3AED0', textAlign: 'center', marginTop: '20px' }}>
                No reviewed submissions found.
              </div>
            )}
          </div>

          {/* TOP METRIC CARDS */}
          <div className="dashboard-grid">
            {/* Total Card */}
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </div>
                <div className="stat-trend up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> +12.5%</div>
              </div>
              <div className="stat-label">Total Publications</div>
              <div className="stat-number">{stats.total}</div>
            </div>

            {/* Approved Card */}
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div className="stat-trend up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> +8.2%</div>
              </div>
              <div className="stat-label">Approved</div>
              <div className="stat-number">{stats.approved}</div>
            </div>

            {/* Pending Card */}
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon" style={{ backgroundColor: 'var(--warning)', color: 'white' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div className="stat-trend down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg> -3.1%</div>
              </div>
              <div className="stat-label">Pending</div>
              <div className="stat-number">{stats.pending}</div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
            {/* PREMIUM AREA CHART: Monthly Progress */}
            <div style={{ flex: '2', minWidth: '400px', padding: '20px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#2B3674', marginBottom: '15px' }}>Cumulative Growth (Live Data)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dynamicAreaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4318FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4318FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#A3AED0', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#A3AED0', fontSize: 12 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Area type="monotone" dataKey="cumulativePoints" stroke="#4318FF" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" name="Total Points" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* PREMIUM DONUT CHART: Publication Breakdown */}
            <div style={{ flex: '1', minWidth: '300px', padding: '20px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ color: '#2B3674', marginBottom: '15px' }}>Contribution Matrix</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={dynamicDonutData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {dynamicDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COMPARATIVE PERFORMANCE MATRIX */}
          <div className="chart-container" style={{ width: '100%', height: 350, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginTop: '20px' }}>
            <h3 style={{ color: '#2B3674', marginBottom: '20px', fontSize: '18px', margin: '0 0 20px 0' }}>Comparative Performance Matrix</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart
                layout="vertical"
                data={comparisonData}
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fill: '#A3AED0' }} />
                <YAxis type="category" dataKey="category" tick={{ fill: '#2B3674', fontWeight: 600 }} />
                <Tooltip cursor={{ fill: '#F4F7FE' }} />
                <Legend />
                <Bar dataKey="yourCount" name="Your Contributions" fill="#2ca02c" barSize={15} />
                <Bar dataKey="deptAverage" name="Dept Average" fill="#98df8a" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;