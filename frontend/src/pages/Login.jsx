// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDept, setSelectedDept] = useState('CSE');

  const handleManualLogin = async (e) => {
    e.preventDefault();

    // 1. Basic Security Check: Are they from your college?
    if (!email.endsWith('@bitsathy.ac.in')) {
      alert('Security Alert: Access restricted to official @bitsathy.ac.in accounts only.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
        department: selectedDept
      });

      const { token, role, department, name } = response.data;

      // Save user details
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('department', department);
      localStorage.setItem('facultyName', name);
      localStorage.setItem('facultyEmail', email);

      // Set default header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (role === 'HOD') {
        navigate('/hod-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert('Invalid credentials');
      } else {
        alert('Login failed due to a server error.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ padding: '40px', textAlign: 'center' }}>
        <div className="login-header">
          <img src={logo} alt="College Logo" style={{ width: '150px', marginBottom: '20px' }} />
          <h2>Faculty Analytics Platform</h2>
          <p style={{ marginBottom: '30px', color: '#7f8c8d' }}>
            Secure login via official college workspace
          </p>
        </div>

        <form className="login-form" onSubmit={handleManualLogin} style={{ textAlign: 'left' }}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: '500', fontSize: '14px' }}>Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E9EDF7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#333' }}
            >
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: '500', fontSize: '14px' }}>College Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@bitsathy.ac.in, hod.cse@bitsathy.ac.in"
              required
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E9EDF7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#34495e', fontWeight: '500', fontSize: '14px' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ width: '100%', padding: '12px 16px', border: '1px solid #E9EDF7', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button type="submit" className="login-btn" style={{ width: '100%', padding: '12px', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', marginTop: '10px' }}>
            Sign In Securely
          </button>
        </form>

        <div className="login-footer" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '12px', color: '#666' }}>
          <p>
            System Access is strictly monitored.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;