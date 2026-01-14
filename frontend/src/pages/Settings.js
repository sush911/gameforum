import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiShield, FiUser, FiMail, FiCalendar, FiCheck, FiX } from 'react-icons/fi';
import Navbar from '../components/Navbar';

function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserSettings();
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const fetchUserSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user || response.data;
      setUser(userData);
      setMfaEnabled(userData.mfa_enabled || false);
      setLoading(false);
    } catch (err) {
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    
    if (newDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    setSuccess('Dark mode ' + (newDarkMode ? 'enabled' : 'disabled'));
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleEnable2FA = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/users/mfa/enable',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOtpSent(true);
      setSuccess('OTP sent to your email! Please check your inbox.');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to enable 2FA');
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/users/mfa/disable',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMfaEnabled(false);
      setSuccess('2FA disabled successfully');
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to disable 2FA');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  if (loading && !user) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTop: '4px solid #0079D3', borderRadius: '50%' }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />

      {/* Settings Content */}
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)', padding: '32px', color: 'white' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiShield size={32} />
              Settings
            </h1>
            <p style={{ opacity: 0.9, fontSize: '16px' }}>Manage your account security and preferences</p>
          </div>

          <div style={{ padding: '32px' }}>
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ padding: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', marginBottom: '24px', color: '#c00', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <FiX size={20} />
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ padding: '16px', background: '#efe', border: '1px solid #cfc', borderRadius: '8px', marginBottom: '24px', color: '#060', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <FiCheck size={20} />
                {success}
              </motion.div>
            )}

            {/* Security Section */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1a1a1a' }}>
                <FiShield size={24} style={{ color: '#0079D3' }} />
                Security
              </h2>
              
              {/* Two-Factor Authentication */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                style={{ padding: '24px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', border: '2px solid #e0e0e0', marginBottom: '20px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔐 Two-Factor Authentication (2FA)
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                      {mfaEnabled ? 'Email OTP verification is active' : 'Add an extra layer of security to your account'}
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                      padding: '8px 16px',
                      background: mfaEnabled ? 'linear-gradient(135deg, #27AE60 0%, #229954 100%)' : 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    {mfaEnabled ? '✓ Enabled' : 'Disabled'}
                  </motion.div>
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ padding: '16px', background: '#e3f2fd', border: '2px solid #90caf9', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', lineHeight: '1.6' }}
                  >
                    📧 OTP sent to <strong>{user?.email}</strong>. Check your email and use the code when logging in next time.
                  </motion.div>
                )}

                {!mfaEnabled ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnable2FA}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                      opacity: loading ? 0.6 : 1,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    {loading ? 'Enabling...' : '🔒 Enable 2FA'}
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDisable2FA}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                      opacity: loading ? 0.6 : 1,
                      boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)'
                    }}
                  >
                    {loading ? 'Disabling...' : '🔓 Disable 2FA'}
                  </motion.button>
                )}
              </motion.div>

              {/* Password Section */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                style={{ padding: '24px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', border: '2px solid #e0e0e0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🔑 Password
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
                      Change your password regularly to keep your account secure
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/password-reset')}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                      boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🔄 Change Password
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Account Info */}
            <div style={{ paddingTop: '32px', borderTop: '2px solid #e0e0e0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1a1a1a' }}>
                <FiUser size={24} style={{ color: '#0079D3' }} />
                Account Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  style={{ padding: '20px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', border: '2px solid #e0e0e0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <FiUser size={18} style={{ color: '#0079D3' }} />
                    <p style={{ color: '#666', fontSize: '13px', fontWeight: 600 }}>Username</p>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>{user?.username}</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  style={{ padding: '20px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', border: '2px solid #e0e0e0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <FiMail size={18} style={{ color: '#0079D3' }} />
                    <p style={{ color: '#666', fontSize: '13px', fontWeight: 600 }}>Email</p>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a', wordBreak: 'break-all' }}>{user?.email}</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  style={{ padding: '20px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', border: '2px solid #e0e0e0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <FiShield size={18} style={{ color: '#0079D3' }} />
                    <p style={{ color: '#666', fontSize: '13px', fontWeight: 600 }}>Role</p>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>{user?.role}</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  style={{ padding: '20px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', border: '2px solid #e0e0e0' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <FiCalendar size={18} style={{ color: '#0079D3' }} />
                    <p style={{ color: '#666', fontSize: '13px', fontWeight: 600 }}>Member Since</p>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>{new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Settings;
