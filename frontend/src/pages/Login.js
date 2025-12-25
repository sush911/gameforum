import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login({ setToken }) {
  const [step, setStep] = useState('credentials'); // credentials, mfa, or complete
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email || !password) {
      setError('Please enter both email and password');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password.trim()
      };

      const response = await axios.post('http://localhost:3000/api/users/login', payload);

      if (response.data.requireMFA) {
        setTempUserId(response.data.tempUserId);
        setStep('mfa');
      } else {
        localStorage.setItem('token', response.data.token);
        setToken(response.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again in 15 minutes');
      } else if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (!err.response) {
        setError('Unable to connect to server. Please check your connection');
      } else {
        setError('Login failed. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMFAVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/users/mfa/verify', {
        userId: tempUserId,
        token: mfaCode
      });

      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Invalid MFA code. Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Game Forum Login</h1>
        <p className="subtitle">Welcome back, gamer</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        {step === 'credentials' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="your@email.com"
                required
                aria-label="Email address"
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                placeholder="Your password"
                required
                aria-label="Password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
              aria-label="Log in to account"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {step === 'mfa' && (
          <form onSubmit={handleMFAVerify}>
            <p className="mfa-description">
              Two-factor authentication is enabled on your account.
              Enter the 6-digit code from your authenticator app.
            </p>

            <div className="form-group">
              <label htmlFor="mfaCode">Authentication Code</label>
              <input
                type="text"
                id="mfaCode"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                required
                aria-label="MFA code"
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading || mfaCode.length !== 6}
              aria-label="Verify MFA code"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setMfaCode('');
                setError('');
              }}
              className="btn btn-secondary"
            >
              Back
            </button>
          </form>
        )}

        <div className="divider">
          <span>New to Game Forum?</span>
        </div>

        <Link to="/register" className="link-button">
          Create an Account
        </Link>

        <Link to="/password-reset" className="link-secondary">
          Forgot Password?
        </Link>

        <div className="security-note">
          <p>🔒 Your login is protected by HTTPS encryption and rate limiting</p>
        </div>
      </div>
    </div>
  );
}

export default Login;














