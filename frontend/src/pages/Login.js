import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // CAPTCHA states
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  
  // MFA states
  const [requireMFA, setRequireMFA] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  
  const navigate = useNavigate();

  // Generate CAPTCHA on component mount
  React.useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setCaptchaValue(randomNum.toString());
    setCaptchaInput('');
    setCaptchaVerified(false);
  };

  const verifyCaptcha = () => {
    if (captchaInput === captchaValue) {
      setCaptchaVerified(true);
      setError('');
      return true;
    } else {
      setError('Invalid CAPTCHA. Please try again.');
      generateCaptcha();
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Verify CAPTCHA first
    if (!captchaVerified) {
      if (!verifyCaptcha()) {
        return;
      }
    }
    
    setLoading(true);
    console.log('Login attempt for:', email);

    try {
      console.log('Calling /api/users/login...');
      const response = await axios.post('http://localhost:3000/api/users/login', {
        email,
        password
      });
      console.log('Login response:', response.data.msg);

      // Check if MFA is required
      if (response.data.requireMFA) {
        console.log('MFA required - showing OTP input');
        setRequireMFA(true);
        setTempUserId(response.data.tempUserId);
        setLoading(false);
        return;
      }

      console.log('Token received:', response.data.token?.substring(0, 20) + '...');

      // Save token
      localStorage.setItem('token', response.data.token);
      console.log('Token saved to localStorage');
      
      // Update auth state
      if (setAuth) setAuth(true);
      window.dispatchEvent(new Event('authChange'));
      console.log('Auth state updated');
      
      // Small delay to ensure state updates before navigation
      console.log('Waiting 100ms before navigation...');
      setTimeout(() => {
        console.log('Navigating to home page...');
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      console.error('Login error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.msg || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Verifying MFA code...');

    try {
      console.log('Calling /api/users/mfa/verify-email-otp...');
      const response = await axios.post('http://localhost:3000/api/users/mfa/verify-email-otp', {
        userId: tempUserId,
        otp: mfaCode
      });
      console.log('MFA verified:', response.data.msg);
      console.log('Token received:', response.data.token?.substring(0, 20) + '...');

      // Save token
      localStorage.setItem('token', response.data.token);
      console.log('Token saved to localStorage');
      
      // Update auth state
      if (setAuth) setAuth(true);
      window.dispatchEvent(new Event('authChange'));
      console.log('Auth state updated');
      
      // Small delay to ensure state updates before navigation
      console.log('Waiting 100ms before navigation...');
      setTimeout(() => {
        console.log('Navigating to home page...');
        navigate('/', { replace: true });
      }, 100);
    } catch (err) {
      console.error('MFA verification error:', err.response?.status, err.response?.data);
      setError(err.response?.data?.msg || 'Invalid OTP code. Please try again.');
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

          <h1 style={styles.title}>{requireMFA ? 'Enter OTP Code' : 'Login'}</h1>

          {error && <div style={styles.error} role="alert" aria-live="polite">{error}</div>}

          {requireMFA ? (
            // MFA Form
            <form onSubmit={handleMFASubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label htmlFor="mfaCode" style={styles.label}>Enter OTP Code</label>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                  Check your email ({email}) for the OTP code
                </p>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  style={styles.input}
                  aria-label="OTP Code"
                  aria-required="true"
                  maxLength="6"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={styles.submitButton}
                aria-label={loading ? 'Verifying' : 'Verify OTP'}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequireMFA(false);
                  setMfaCode('');
                  setTempUserId(null);
                  setError('');
                }}
                style={{ ...styles.submitButton, background: '#666', marginTop: '12px' }}
              >
                Back to Login
              </button>
            </form>
          ) : (
            // Login Form
            <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>Username or email</label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or Username"
                style={styles.input}
                aria-label="Email or Username"
                aria-required="true"
                required
              />
            </div>

            {/* CAPTCHA Verification */}
            <div style={styles.inputGroup}>
              <label htmlFor="captcha" style={styles.label}>Security Verification</label>
              <div style={styles.captchaContainer}>
                <div style={styles.captchaDisplay}>
                  {captchaValue}
                </div>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  style={styles.captchaRefresh}
                  aria-label="Refresh CAPTCHA"
                  title="Generate new code"
                >
                  🔄
                </button>
              </div>
              <input
                id="captcha"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter the 6-digit code above"
                style={styles.input}
                aria-label="CAPTCHA Code"
                aria-required="true"
                maxLength="6"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={styles.input}
                  aria-label="Password"
                  aria-required="true"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div style={styles.rememberRow}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={styles.checkbox}
                  aria-label="Remember me"
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
              aria-label={loading ? 'Logging in' : 'Log in'}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          )}

          <div style={styles.footer}>
            <Link to="/register" style={styles.link}>Sign up</Link>
            <span style={styles.separator}>•</span>
            <Link to="/password-reset" style={styles.link}>Forgot password?</Link>
          </div>
        </div>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.imageOverlay}>
          <h2 style={styles.imageTitle}>Welcome to GameForum</h2>
          <p style={styles.imageSubtitle}>Connect with gamers worldwide</p>
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
    marginBottom: '32px',
    color: '#1a1a1a'
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
  rememberRow: {
    display: 'flex',
    alignItems: 'center'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
    cursor: 'pointer'
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  captchaContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '12px'
  },
  captchaDisplay: {
    flex: 1,
    padding: '16px',
    fontSize: '24px',
    fontWeight: 'bold',
    letterSpacing: '8px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
    color: 'white',
    borderRadius: '8px',
    userSelect: 'none',
    fontFamily: 'monospace'
  },
  captchaRefresh: {
    padding: '12px 16px',
    fontSize: '20px',
    background: '#f0f0f0',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
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
  separator: {
    margin: '0 12px',
    color: '#ccc'
  },
  rightSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
    backgroundImage: 'url("https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200"), linear-gradient(135deg, rgba(0, 121, 211, 0.8) 0%, rgba(0, 86, 163, 0.8) 100%)',
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

export default Login;
