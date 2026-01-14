import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');

    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
  };

  const evaluatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required');
      return false;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, hyphens, and underscores');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      await axios.post('http://localhost:3000/api/users/register', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim()
      });

      navigate('/login');
    } catch (err) {
      if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (err.response?.status === 429) {
        setError('Too many registration attempts. Please try again later');
      } else {
        setError('Registration failed. Please try again');
      }
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

          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join the gaming community</p>

          {error && <div style={styles.error} role="alert" aria-live="polite">{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label htmlFor="username" style={styles.label}>Username</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose your username"
                style={styles.input}
                disabled={loading}
                aria-label="Username"
                aria-required="true"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                style={styles.input}
                disabled={loading}
                autoComplete="email"
                aria-label="Email address"
                aria-required="true"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  style={styles.input}
                  disabled={loading}
                  autoComplete="new-password"
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
              <PasswordStrengthMeter strength={passwordStrength} />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="confirmPassword" style={styles.label}>Confirm Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  style={styles.input}
                  disabled={loading}
                  autoComplete="new-password"
                  aria-label="Confirm password"
                  aria-required="true"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={styles.submitButton}
              aria-label={loading ? 'Creating account' : 'Sign up'}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div style={styles.footer}>
            <span style={{ color: '#666' }}>Already have an account?</span>
            <Link to="/login" style={styles.link}>Sign in</Link>
          </div>

          <div style={styles.securityBadge}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
              ✓ Bcrypt encryption<br />
              ✓ Multi-factor authentication<br />
              ✓ Secure session management
            </div>
          </div>
        </div>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.imageOverlay}>
          <h2 style={styles.imageTitle}>Join GameForum</h2>
          <p style={styles.imageSubtitle}>Connect, share, and game together</p>
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🎮</span>
              <span>Discuss your favorite games</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>👥</span>
              <span>Find gaming buddies</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>🏆</span>
              <span>Share your achievements</span>
            </div>
          </div>
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
    zIndex: 2,
    overflowY: 'auto'
  },
  formContainer: {
    width: '100%',
    maxWidth: '400px'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px'
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
    fontSize: '16px',
    color: '#666',
    marginBottom: '24px'
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
    gap: '20px'
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  link: {
    color: '#0079D3',
    textDecoration: 'none',
    fontWeight: 600
  },
  securityBadge: {
    marginTop: '20px',
    padding: '16px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#059669'
  },
  rightSide: {
    flex: 1,
    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
    backgroundImage: 'url("https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200"), linear-gradient(135deg, rgba(0, 121, 211, 0.8) 0%, rgba(0, 86, 163, 0.8) 100%)',
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
    marginBottom: '40px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '18px',
    textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
  },
  featureIcon: {
    fontSize: '24px'
  }
};

export default Register;
