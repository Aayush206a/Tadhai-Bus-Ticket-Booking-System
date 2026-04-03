import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token);
      // Redirect based on role
      if (user.role === 'agency') {
        navigate('/agency');
      } else {
        navigate('/passenger');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🚌</div>
          <h2 style={{ margin: '0.5rem 0 0', color: '#1a237e' }}>Welcome Back</h2>
          <p style={{ color: '#666', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={errorBox}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={fieldGroup}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button type="submit" disabled={loading} style={submitBtn(loading)}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1a237e', fontWeight: 600 }}>Register here</Link>
        </p>
      </div>
    </div>
  );
};

const pageWrap = {
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  backgroundColor: '#f5f7fa',
};

const card = {
  background: 'white',
  borderRadius: '12px',
  padding: '2.5rem',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
};

const fieldGroup = { marginBottom: '1.25rem' };

const labelStyle = {
  display: 'block',
  marginBottom: '0.4rem',
  fontWeight: 500,
  fontSize: '0.9rem',
  color: '#333',
};

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  transition: 'border-color 0.2s',
};

const submitBtn = (loading) => ({
  width: '100%',
  padding: '0.8rem',
  backgroundColor: loading ? '#9e9e9e' : '#1a237e',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: loading ? 'not-allowed' : 'pointer',
  marginTop: '0.5rem',
  transition: 'background-color 0.2s',
});

const errorBox = {
  backgroundColor: '#ffebee',
  color: '#c62828',
  padding: '0.75rem 1rem',
  borderRadius: '6px',
  marginBottom: '1.25rem',
  fontSize: '0.9rem',
  border: '1px solid #ffcdd2',
};

export default Login;
