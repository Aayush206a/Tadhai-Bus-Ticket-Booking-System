import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
    <div style={{ fontSize: '4rem' }}>🚌</div>
    <h1 style={{ color: '#1a237e', fontSize: '2rem' }}>404 – Page Not Found</h1>
    <p style={{ color: '#666', marginBottom: '2rem' }}>
      The page you are looking for doesn't exist or has been moved.
    </p>
    <Link
      to="/"
      style={{
        backgroundColor: '#1a237e', color: 'white',
        padding: '0.75rem 2rem', textDecoration: 'none',
        borderRadius: '6px', fontWeight: 600,
      }}
    >
      Back to Home
    </Link>
  </div>
);

export default NotFound;
