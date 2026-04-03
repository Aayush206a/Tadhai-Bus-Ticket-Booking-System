import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const decodeAndSetUser = (tkn) => {
    try {
      const decoded = jwtDecode(tkn);
      setUser({
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      });
      return true;
    } catch (err) {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      return false;
    }
  };

  useEffect(() => {
    if (token) {
      decodeAndSetUser(token);
    }
    setLoading(false);
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    decodeAndSetUser(newToken);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
