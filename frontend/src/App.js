import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import api from './api';
import Loader from './components/Loader';
import SuspenseFallback from './components/SuspenseFallback';
import { SettingsProvider } from './context/SettingsContext';

// Lazy load components for route-based code splitting
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    navigate('/');
  };

  const handleLogout = () => {
    api.post('/auth/logout').then(() => {
      setUser(null);
      navigate('/login');
    });
  };

  if (loading) {
    return <Loader message="Initializing application..." fullScreen={true} />;
  }

  return (
    <SettingsProvider>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route
            path="/login"
            element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />}
          />
          <Route
            path="/*"
            element={user ? <Dashboard user={user} onLogout={handleLogout} onUserUpdate={setUser} /> : <Navigate to="/login" replace />}
          />
        </Routes>
      </Suspense>
    </SettingsProvider>
  );
}
