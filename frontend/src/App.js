import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './GamingForum.css';
import './index.css';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import NewHome from './pages/NewHome';
import EnhancedProfile from './pages/EnhancedProfile';
import PublicUserProfile from './pages/PublicUserProfile';
import CommunityPage from './pages/CommunityPage';
import PostDetail from './pages/PostDetail';
import AdminPanel from './pages/AdminPanel';
import CommunityManagement from './pages/CommunityManagement';
import Donate from './pages/Donate';
import DonateSuccess from './pages/DonateSuccess';
import Settings from './pages/Settings';

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for token on mount and when location/storage changes
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const newAuthState = !!token;
      if (newAuthState !== isAuthenticated) {
        setIsAuthenticated(newAuthState);
      }
    };

    checkAuth();

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', checkAuth);
    
    // Custom event for same-tab login/logout
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, [location, isAuthenticated]);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
      <Route path="/password-reset" element={<PasswordReset />} />
      <Route path="/profile" element={isAuthenticated ? <EnhancedProfile /> : <Navigate to="/login" replace />} />
      <Route path="/user/:identifier" element={<PublicUserProfile />} />
      <Route path="/community/:slug" element={<CommunityPage />} />
      <Route path="/post/:id" element={<PostDetail />} />
      <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" replace />} />
      <Route path="/donate" element={isAuthenticated ? <Donate /> : <Navigate to="/login" replace />} />
      <Route path="/donate/success" element={isAuthenticated ? <DonateSuccess /> : <Navigate to="/login" replace />} />
      <Route path="/admin" element={isAuthenticated ? <AdminPanel /> : <Navigate to="/login" replace />} />
      <Route path="/communities" element={isAuthenticated ? <CommunityManagement /> : <Navigate to="/login" replace />} />
      <Route path="/community" element={isAuthenticated ? <CommunityManagement /> : <Navigate to="/login" replace />} />
      <Route path="/" element={isAuthenticated ? <NewHome /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AppRoutes />
    </Router>
  );
}

export default App;
