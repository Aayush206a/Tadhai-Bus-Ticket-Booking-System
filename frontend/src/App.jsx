import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthContext from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AgencyDashboard from './pages/AgencyDashboard';
import PassengerDashboard from './pages/PassengerDashboard';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/agency/*"
                element={
                  <RequireRole role="agency">
                    <AgencyDashboard />
                  </RequireRole>
                }
              />

              <Route
                path="/passenger/*"
                element={
                  <RequireRole role="passenger">
                    <PassengerDashboard />
                  </RequireRole>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

function RequireRole({ role: requiredRole, children }) {
  const { user, isAuthenticated, loading } = React.useContext(AuthContext);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role !== requiredRole) return <Navigate to="/" replace />;

  return children;
}

export default App;
