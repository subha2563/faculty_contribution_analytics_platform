// src/pages/Instructions.jsx
import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import './Dashboard.css'; // Reusing dashboard grid and layout styles

const Instructions = () => {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper">
                <Topbar />

                <main className="main-content">
                    <div style={{
                        backgroundColor: '#FFFFFF',
                        padding: '30px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                        marginBottom: '20px'
                    }}>
                        <h2 style={{ color: '#2B3674', marginBottom: '25px', fontSize: '24px' }}>
                            Portal Guidelines & Evaluation Metrics
                        </h2>

                        {/* Section 1: How to Use */}
                        <h3 style={{ color: '#2B3674', fontSize: '18px', marginBottom: '15px' }}>
                            1. How to Use the Portal
                        </h3>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                            gap: '20px',
                            marginBottom: '35px'
                        }}>
                            <div style={{ padding: '20px', backgroundColor: '#F4F7FE', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#4318FF' }}>Step 1: Upload Submission</h4>
                                <p style={{ margin: 0, color: '#A3AED0', fontSize: '14px' }}>Submit your research papers, patents, or publications through the Upload portal with valid proof.</p>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#F4F7FE', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#4318FF' }}>Step 2: Await Verification</h4>
                                <p style={{ margin: 0, color: '#A3AED0', fontSize: '14px' }}>Your HOD will review the submission. Once verified, it will be marked as 'Approved'.</p>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#F4F7FE', borderRadius: '12px' }}>
                                <h4 style={{ margin: '0 0 10px 0', color: '#4318FF' }}>Step 3: Track API Points</h4>
                                <p style={{ margin: 0, color: '#A3AED0', fontSize: '14px' }}>Approved submissions automatically award Academic Performance Indicator (API) points to your dashboard.</p>
                            </div>
                        </div>

                        {/* Section 2: Points System */}
                        <h3 style={{ color: '#2B3674', fontSize: '18px', marginBottom: '15px' }}>
                            2. The API Points System
                        </h3>
                        <p style={{ color: '#A3AED0', fontSize: '14px', marginBottom: '15px' }}>
                            Base API points are awarded strictly upon HOD approval based on the type of contribution.
                        </p>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '35px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #E9EDF7', color: '#A3AED0' }}>
                                    <th style={{ padding: '12px' }}>Contribution Type</th>
                                    <th style={{ padding: '12px' }}>Base Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style={{ borderBottom: '1px solid #E9EDF7' }}>
                                    <td style={{ padding: '12px', color: '#2B3674', fontWeight: '500' }}>Patents</td>
                                    <td style={{ padding: '12px', color: '#4318FF', fontWeight: '600' }}>50 Points</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #E9EDF7' }}>
                                    <td style={{ padding: '12px', color: '#2B3674', fontWeight: '500' }}>Journals</td>
                                    <td style={{ padding: '12px', color: '#4318FF', fontWeight: '600' }}>30 Points</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #E9EDF7' }}>
                                    <td style={{ padding: '12px', color: '#2B3674', fontWeight: '500' }}>Book Chapters</td>
                                    <td style={{ padding: '12px', color: '#4318FF', fontWeight: '600' }}>20 Points</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #E9EDF7' }}>
                                    <td style={{ padding: '12px', color: '#2B3674', fontWeight: '500' }}>Conferences</td>
                                    <td style={{ padding: '12px', color: '#4318FF', fontWeight: '600' }}>10 Points</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* Section 3: HOD Multipliers */}
                        <h3 style={{ color: '#2B3674', fontSize: '18px', marginBottom: '15px' }}>
                            3. HOD Quality Multipliers
                        </h3>
                        <div style={{ padding: '20px', backgroundColor: '#FFF5E5', borderLeft: '4px solid #FFCE20', borderRadius: '8px', marginBottom: '35px' }}>
                            <p style={{ margin: 0, color: '#2B3674', fontSize: '14px', lineHeight: '1.6' }}>
                                Points are not strictly static. During the approval process, the Head of Department may apply a quality multiplier based on the prestige of the publication (e.g., <strong>1.5x</strong> multiplier for a Tier 1 International Journal, or <strong>1.0x</strong> for a Standard publication).
                            </p>
                        </div>

                        {/* Section 4: Quality Tier Classification */}
                        <h3 style={{ color: '#2B3674', fontSize: '18px', marginBottom: '15px' }}>
                            4. Quality Tier Classification (The Multiplier System)
                        </h3>
                        <div style={{ backgroundColor: '#F8F9FA', borderRadius: '12px', padding: '20px', marginBottom: '35px', borderLeft: '4px solid #4318FF' }}>
                            <p style={{ color: '#475467', fontSize: '14px', marginBottom: '15px' }}>The Head of Department will grade your publication into one of three quality tiers, which act as a multiplier on your base points.</p>
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                                <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #E9EDF7' }}>
                                    <strong style={{ color: '#2B3674', fontSize: '15px' }}>Tier 1 (1.5x Multiplier) - Exceptional</strong>
                                    <p style={{ margin: '5px 0 0 0', color: '#A3AED0', fontSize: '13px' }}>Reserved for Scopus Q1/Q2 or high-impact Web of Science Journals (Impact Factor &gt; 2.0).</p>
                                </li>
                                <li style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #E9EDF7' }}>
                                    <strong style={{ color: '#2B3674', fontSize: '15px' }}>Tier 2 (1.0x Multiplier) - Standard</strong>
                                    <p style={{ margin: '5px 0 0 0', color: '#A3AED0', fontSize: '13px' }}>For Scopus Q3/Q4, UGC-CARE indexed journals, or reputed International Conferences (IEEE/Springer).</p>
                                </li>
                                <li>
                                    <strong style={{ color: '#2B3674', fontSize: '15px' }}>Tier 3 (0.5x Multiplier) - Basic</strong>
                                    <p style={{ margin: '5px 0 0 0', color: '#A3AED0', fontSize: '13px' }}>For non-indexed journals, local peer-reviewed conferences, or departmental symposiums.</p>
                                </li>
                            </ul>
                        </div>

                        {/* Section 5: Department Goal */}
                        <h3 style={{ color: '#2B3674', fontSize: '18px', marginBottom: '15px' }}>
                            5. The Department Goal
                        </h3>
                        <div style={{ padding: '20px', backgroundColor: '#E0F8EF', borderLeft: '4px solid #01B574', borderRadius: '8px' }}>
                            <p style={{ margin: 0, color: '#2B3674', fontSize: '14px', lineHeight: '1.6' }}>
                                Your Dashboard tracks your total API points against the <strong>Live Department Average</strong>. The goal is to consistently publish and ensure your individual score meets or exceeds the department benchmark.
                            </p>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Instructions;
