import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function PasswordReset() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/password/reset-otp-request', {
        email: email.trim()
      });
      
      setSuccess('Check your email for the 6-digit code');
      setOtpCountdown(1800); // 30 minutes
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP from your email');
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Please enter both passwords');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:3000/api/users/password/reset-otp-confirm', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim()
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/password/reset-otp-request', {
        email: email.trim()
      });
      
      setSuccess('New code sent to your email');
      setOtpCountdown(1800);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftSide}>
        <div style={styles.formContainer}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎮</span>
            <span style={styles.logoText}>GameForum</span>
          </div>

          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.subtitle}>
            {step === 'email' ? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          {step === 'email' ? (
            <form onSubmit={handleRequestReset} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>6-Digit Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  style={{ ...styles.input, fontSize: '20px', letterSpacing: '8px', textAlign: 'center' }}
                  maxLength="6"
                  disabled={loading}
                  required
                  autoFocus
                />
                <small style={{ fontSize: '12px', color: '#666' }}>
                  Code sent to {email}
                  {otpCountdown > 0 && ` • Expires in ${formatCountdown(otpCountdown)}`}
                </small>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>New Password</label>
                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Create new password"
                    style={styles.input}
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                <small style={{ fontSize: '12px', color: '#666' }}>
                  Min 8 characters, uppercase, lowercase, number, special char
                </small>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Confirm new password"
                  style={styles.input}
                  disabled={loading}
                  required
                />
              </div>

              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {otpCountdown > 0 && (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    style={styles.linkButton}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                    setSuccess('');
                  }}
                  style={styles.linkButton}
                >
                  Back
                </button>
              </div>
            </form>
          )}

          <div style={styles.footer}>
            Remember your password? <Link to="/login" style={styles.link}>Sign in</Link>
          </div>
        </div>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.imageOverlay}>
          <h2 style={styles.imageTitle}>Secure Account Recovery</h2>
          <p style={styles.imageSubtitle}>Reset your password safely</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  leftSide: {
    flex: '0 0 500px',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    boxShadow: '2px 0 20px rgba(0,0,0,0.1)',
    zIndex: 2
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '40px'
  },
  logoIcon: {
    fontSize: '36px'
  },
  logoText: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a1a1a'
  },
  title: {
    fontSize: '32px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#1a1a1a'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '32px'
  },
  error: {
    padding: '12px 16px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c00',
    fontSize: '14px',
    marginBottom: '20px'
  },
  success: {
    padding: '12px 16px',
    background: '#efe',
    border: '1px solid #cfc',
    borderRadius: '8px',
    color: '#060',
    fontSize: '14px',
    marginBottom: '20px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: 'white',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%'
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '4px'
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: 700,
    color: 'white',
    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, opacity 0.2s',
    marginTop: '8px',
    boxSizing: 'border-box'
  },
  linkButton: {
    background: 'transparent',
    border: 'none',
    color: '#0079D3',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#666'
  },
  link: {
    color: '#0079D3',
    textDecoration: 'none',
    fontWeight: 600
  },
  rightSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
    backgroundImage: 'url("https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=1200"), linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundBlendMode: 'overlay',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  imageOverlay: {
    textAlign: 'center',
    color: 'white',
    padding: '40px',
    zIndex: 1
  },
  imageTitle: {
    fontSize: '48px',
    fontWeight: 700,
    marginBottom: '16px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  imageSubtitle: {
    fontSize: '20px',
    opacity: 0.9,
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  }
};

export default PasswordReset;
