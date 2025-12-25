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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('All fields are required');
      return false;
    }

    if (username.trim().length < 3 || username.trim().length > 30) {
      setError('Username must be 3-30 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
      setError('Password must have uppercase, lowercase, number, special character, and be 8+ characters');
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
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim()
      };

      const response = await axios.post('http://localhost:3000/api/users/register', payload);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Username or email already exists');
      } else if (err.response?.data?.msg) {
        setError(err.response.data.msg);
      } else if (!err.response) {
        setError('Connection error. Please check your internet and try again');
      } else {
        setError('Registration failed. Please try again later');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Game Forum Account</h1>
        <p className="subtitle">Join our gaming community today</p>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              placeholder="3-30 characters, letters/numbers/_"
              required
              aria-label="Username"
              autoComplete="username"
            />
          </div>

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
              placeholder="Strong password (8+ chars)"
              required
              aria-label="Password"
              autoComplete="new-password"
            />
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
              placeholder="Confirm your password"
              required
              aria-label="Confirm password"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
            aria-label="Register account"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="divider">
          <span>Already have an account?</span>
        </div>

        <Link to="/login" className="link-button">
          Sign In Instead
        </Link>

        <div className="security-note">
          <p>🔒 Your password is encrypted with industry-standard security</p>
        </div>
      </div>
    </div>
  );
}

export default Register;
