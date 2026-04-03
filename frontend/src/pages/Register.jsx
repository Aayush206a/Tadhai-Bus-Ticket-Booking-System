import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'passenger',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };
      if (formData.role === 'agency') {
        payload.businessName = formData.businessName;
      }
      const response = await api.post('/auth/register', payload);
      const { token, user } = response.data;
      login(token);
      navigate(user.role === 'agency' ? '/agency' : '/passenger');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem' }}>🚌</div>
          <h2 style={{ margin: '0.5rem 0 0', color: '#1a237e' }}>Create Account</h2>
          <p style={{ color: '#666', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>Join Tadhai Bus Booking today</p>
        </div>

        {error && <div style={errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Role selector */}
          <div style={fieldGroup}>
            <label style={labelStyle}>I am a</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['passenger', 'agency'].map((r) => (
                <label key={r} style={{
                  flex: 1,
                  padding: '0.6rem',
                  border: `2px solid ${formData.role === r ? '#1a237e' : '#ddd'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  backgroundColor: formData.role === r ? '#e8eaf6' : 'white',
                  fontWeight: formData.role === r ? 600 : 400,
                  fontSize: '0.9rem',
                  color: formData.role === r ? '#1a237e' : '#333',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={formData.role === r}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  {r === 'passenger' ? '🧳 Passenger' : '🏢 Travel Agency'}
                </label>
              ))}
            </div>
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              style={inputStyle}
            />
          </div>

          {formData.role === 'agency' && (
            <div style={fieldGroup}>
              <label style={labelStyle}>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                placeholder="My Travel Agency Pvt. Ltd."
                style={inputStyle}
              />
            </div>
          )}

          <div style={fieldGroup}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div style={fieldGroup}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="+977-98XXXXXXXX"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={fieldGroup}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Min 6 chars"
                style={inputStyle}
              />
            </div>
            <div style={fieldGroup}>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Repeat password"
                style={inputStyle}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={submitBtn(loading)}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1a237e', fontWeight: 600 }}>Sign in</Link>
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
  maxWidth: '520px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
};

const fieldGroup = { marginBottom: '1rem' };
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
  fontSize: '0.95rem',
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

export default Register;
