import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardLink = user?.role === 'agency' ? '/agency' : '/passenger';

  return (
    <header style={{
      backgroundColor: '#1a237e',
      color: 'white',
      padding: '0 1.5rem',
      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
      }}>
        <Link
          to="/"
          style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' }}
        >
          🚌 Tadhai Bus Booking
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={navLinkStyle}>Login</Link>
              <Link to="/register" style={{ ...navLinkStyle, backgroundColor: '#4caf50', padding: '0.4rem 1rem', borderRadius: '4px' }}>
                Register
              </Link>
            </>
          ) : (
            <>
              <Link to={dashboardLink} style={navLinkStyle}>Dashboard</Link>
              <span style={{ color: '#b0bec5', fontSize: '0.9rem' }}>
                {user.name} <span style={{ color: '#90caf9' }}>({user.role})</span>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#e53935',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

const navLinkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontWeight: 500,
};

export default Header;
