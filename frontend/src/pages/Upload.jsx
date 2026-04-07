// src/pages/Upload.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const TIER_CONFIG = {
  "Tier 1": { basePoints: 50, maxCoAuthors: 3 },
  "Tier 2": { basePoints: 30, maxCoAuthors: 2 },
  "Tier 3": { basePoints: 15, maxCoAuthors: 1 }
};

const Upload = () => {
  const [formData, setFormData] = useState({ title: '', journal: 'Journal', date: '', credentialId: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState('');
  
  const [allFaculty, setAllFaculty] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);

  const [tier, setTier] = useState('Tier 2');
  const [tierWarning, setTierWarning] = useState('');

  // Dynamic Co-Author States
  const [primaryPercentage, setPrimaryPercentage] = useState(100);
  const [hasCoAuthors, setHasCoAuthors] = useState(false);
  const [numCoAuthors, setNumCoAuthors] = useState(1);
  const [coAuthorList, setCoAuthorList] = useState([{ name: '', email: '', percentage: 0 }]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('https://faculty-contribution-analytics-platform.onrender.com/api/auth/faculty', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllFaculty(res.data);
      } catch (err) {
        console.error("Error fetching faculty users", err);
      }
    };
    fetchUsers();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleNumCoAuthorsChange = (e) => {
    let num = parseInt(e.target.value) || 0;
    if (num < 1) num = 1;
    
    setNumCoAuthors(num);
    setCoAuthorList(prev => {
        const newList = [...prev];
        while (newList.length < num) newList.push({ name: '', email: '', percentage: 0 });
        return newList.slice(0, num);
    });
  };

  useEffect(() => {
    const maxAllowed = TIER_CONFIG[tier].maxCoAuthors;
    if (hasCoAuthors && numCoAuthors > maxAllowed) {
      setTierWarning(`Maximum co-authors allowed for ${tier} is ${maxAllowed}.`);
    } else {
      setTierWarning('');
    }
  }, [tier, numCoAuthors, hasCoAuthors]);

  const handleCoAuthorChange = (idx, field, value) => {
    const newList = [...coAuthorList];
    newList[idx][field] = value;
    if (field === 'name') newList[idx].email = ''; // Reset email if typing manually
    setCoAuthorList(newList);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Pre-Submit Validation
    if (hasCoAuthors) {
      let total = Number(primaryPercentage) || 0;
      coAuthorList.forEach(ca => total += (Number(ca.percentage) || 0));
      if (total !== 100) {
        setValidationError("Total contribution must equal 100%.");
        return;
      }
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('type', formData.journal);
    data.append('date', formData.date);

    const realName = localStorage.getItem('facultyName');
    const realEmail = localStorage.getItem('facultyEmail');
    const userDept = localStorage.getItem('department') || 'CSE';

    data.append('facultyName', realName ? realName : 'Faculty User');
    data.append('facultyEmail', realEmail ? realEmail : 'faculty@bitsathy.ac.in');
    data.append('department', userDept);
    data.append('tier', tier);
    data.append('credentialId', formData.credentialId);
    
    data.append('primaryAuthorPercentage', hasCoAuthors ? primaryPercentage : 100);
    const validCoAuthors = hasCoAuthors ? coAuthorList.filter(ca => ca.name.trim() !== '') : [];
    data.append('coAuthors', JSON.stringify(validCoAuthors));

    if (selectedFile) data.append('file', selectedFile);

    try {
      await axios.post('https://faculty-contribution-analytics-platform.onrender.com/api/contributions', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert("✅ Paper Uploaded Successfully!");
      setFormData({ title: '', journal: 'Journal', date: '', credentialId: '' });
      setSelectedFile(null);
      setHasCoAuthors(false);
      setPrimaryPercentage(100);
      setNumCoAuthors(1);
      setCoAuthorList([{ name: '', email: '', percentage: 0 }]);
      document.querySelector('input[type="file"]').value = '';
    } catch (error) {
      console.error("Backend Error:", error);
      alert("❌ Error uploading file. Check your VS Code terminal for the exact error.");
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">

          <div style={{ marginBottom: '24px' }}>
            <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '4px' }}>Submit Data</p>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1E293B' }}>Upload Contribution</h2>
          </div>

          <div className="table-card" style={{ maxWidth: '600px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {validationError && (
                <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontWeight: '500', fontSize: '14px', border: '1px solid #FCA5A5' }}>
                  ❌ {validationError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Paper/Project Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Publication Type</label>
                <select name="journal" value={formData.journal} onChange={handleChange}
                  style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none', backgroundColor: 'white' }}>
                  <option value="Journal">Journal Article</option>
                  <option value="Conference">Conference Paper</option>
                  <option value="Patent">Patent</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Evaluation Tier</label>
                <select name="tier" value={tier} onChange={(e) => setTier(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none', backgroundColor: 'white' }}>
                  <option value="Tier 1">Tier 1 (Max 3 Co-Authors)</option>
                  <option value="Tier 2">Tier 2 (Max 2 Co-Authors)</option>
                  <option value="Tier 3">Tier 3 (Max 1 Co-Author)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Date of Publication</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} required
                  style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Credential ID (DOI / Patent No.)</label>
                <input type="text" name="credentialId" value={formData.credentialId} onChange={handleChange} required
                  placeholder="e.g. 10.1109/TNNLS.2023..."
                  style={{ padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none' }} />
              </div>

              {/* Dynamic Co-Author Section */}
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '16px', marginTop: 0 }}>Authorship Split</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {hasCoAuthors && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label style={{ fontSize: '14px', flex: 1, fontWeight: '500', color: '#475467' }}>Your Contribution (%)</label>
                      <input type="number" min="0" max="100" value={primaryPercentage} onChange={(e) => setPrimaryPercentage(e.target.value)} required
                        style={{ width: '80px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none', textAlign: 'center' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: hasCoAuthors ? '10px' : '0' }}>
                    <input type="checkbox" id="addCoAuthors" checked={hasCoAuthors} onChange={(e) => setHasCoAuthors(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="addCoAuthors" style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B', cursor: 'pointer' }}>Add Co-Authors</label>
                  </div>

                  {hasCoAuthors && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <label style={{ fontSize: '14px', flex: 1, fontWeight: '500', color: '#475467' }}>How many Co-Authors?</label>
                        <input type="number" min="1" max="10" value={numCoAuthors} onChange={handleNumCoAuthorsChange}
                          style={{ width: '80px', padding: '8px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none', textAlign: 'center' }} />
                      </div>

                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {coAuthorList.map((ca, idx) => (
                          <div key={idx} style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                              <input 
                                type="text" 
                                value={ca.name} 
                                onChange={(e) => handleCoAuthorChange(idx, 'name', e.target.value)}
                                onFocus={() => setActiveSuggestionIndex(idx)}
                                onBlur={() => setTimeout(() => setActiveSuggestionIndex(null), 200)}
                                placeholder="Search faculty name..."
                                required
                                style={{ width: '100%', padding: '10px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }} 
                              />
                              {activeSuggestionIndex === idx && (
                                <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', zIndex: 9999, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxHeight: '150px', overflowY: 'auto' }}>
                                  {allFaculty.length === 0 ? (
                                    <div style={{ padding: '10px', color: 'red' }}>API Error: No users loaded</div>
                                  ) : (
                                    allFaculty.filter(fac => fac.name.toLowerCase().includes(ca.name.toLowerCase())).length === 0 ? (
                                      <div style={{ padding: '10px', color: 'gray' }}>No matching faculty found</div>
                                    ) : (
                                      allFaculty.filter(fac => fac.name.toLowerCase().includes(ca.name.toLowerCase())).map((fac, fIdx) => (
                                        <div 
                                          key={fIdx} 
                                          onMouseDown={() => {
                                            handleCoAuthorChange(idx, 'name', fac.name);
                                            handleCoAuthorChange(idx, 'email', fac.email);
                                            setActiveSuggestionIndex(null);
                                          }}
                                          style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                                          onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                          <div style={{ fontWeight: '500' }}>{fac.name}</div>
                                          <div style={{ fontSize: '11px', color: '#64748B' }}>{fac.email}</div>
                                        </div>
                                      ))
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            <div style={{ width: '80px', display: 'flex', alignItems: 'center', position: 'relative' }}>
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                placeholder="%" 
                                value={ca.percentage} 
                                onChange={(e) => handleCoAuthorChange(idx, 'percentage', e.target.value)} 
                                required
                                style={{ width: '100%', padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px', outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px', border: '1px dashed #CBD5E1', borderRadius: '6px', backgroundColor: '#F8FAFC' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1E293B' }}>Upload Document (PDF)</label>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                <small style={{ color: '#64748B', fontSize: '12px' }}>Max file size: 5MB</small>
              </div>

              {tierWarning && (
                <div style={{ padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '6px', fontWeight: '500', fontSize: '14px', border: '1px solid #FCA5A5' }}>
                  ⚠️ {tierWarning}
                </div>
              )}

              <button 
                type="submit" 
                disabled={!!tierWarning}
                style={{ 
                  backgroundColor: tierWarning ? '#94A3B8' : '#3B82F6', 
                  color: 'white', 
                  padding: '12px', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  cursor: tierWarning ? 'not-allowed' : 'pointer', 
                  marginTop: '10px' 
                }}>
                Submit Contribution
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Upload;