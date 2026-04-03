import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div style={{ minHeight: '80vh', background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '5rem 2rem 3rem', color: 'white' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚌</div>
        <h1 style={{ fontSize: '2.8rem', margin: '0 0 1rem', fontWeight: 700, color: 'white' }}>
          Tadhai Bus Booking
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#c5cae9', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
          Book bus tickets across Nepal quickly and easily
        </p>

        {!isAuthenticated ? (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={heroBtnPrimary}>Get Started</Link>
            <Link to="/login" style={heroBtnSecondary}>Sign In</Link>
          </div>
        ) : (
          <Link
            to={user.role === 'agency' ? '/agency' : '/passenger'}
            style={heroBtnPrimary}
          >
            Go to Dashboard →
          </Link>
        )}
      </div>

      {/* Feature cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
      }}>
        {features.map((f, i) => (
          <div key={i} style={featureCard}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#1a237e', fontSize: '1rem' }}>{f.title}</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const features = [
  { icon: '🔍', title: 'Search Routes', desc: 'Find buses between any two locations across Nepal' },
  { icon: '💺', title: 'Choose Your Seat', desc: 'Pick your preferred seat from an interactive seat map' },
  { icon: '⚡', title: 'Instant Booking', desc: 'Confirm your ticket in seconds' },
  { icon: '📋', title: 'Manage Bookings', desc: 'View and cancel your bookings anytime' },
];

const heroBtnPrimary = {
  backgroundColor: '#4caf50',
  color: 'white',
  padding: '0.85rem 2rem',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '1rem',
  display: 'inline-block',
};

const heroBtnSecondary = {
  backgroundColor: 'rgba(255,255,255,0.15)',
  color: 'white',
  padding: '0.85rem 2rem',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 600,
  fontSize: '1rem',
  border: '1px solid rgba(255,255,255,0.4)',
  display: 'inline-block',
};

const featureCard = {
  backgroundColor: 'white',
  borderRadius: '10px',
  padding: '1.5rem',
  textAlign: 'center',
  boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
};

export default Home;
