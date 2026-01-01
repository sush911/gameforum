import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import PasswordReset from './pages/PasswordReset';
import Home from './pages/Home';
import EnhancedProfile from './pages/EnhancedProfile';
import EnhancedAdminPanel from './pages/EnhancedAdminPanel';
import Donate from './pages/Donate';
import './App.css';
import './RetroGamer.css';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  return (
    <Router>
      <div className="App">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route
            path="/profile"
            element={token ? <EnhancedProfile /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={token ? <EnhancedAdminPanel /> : <Navigate to="/login" />}
          />
          <Route path="/donate" element={<Donate />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
