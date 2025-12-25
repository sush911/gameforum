import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function PasswordReset() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:3000/api/users/password/reset-request', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('passwords dont match bro');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/users/password/reset', {
        email,
        code,
        newPassword
      });
      setError('');
      alert('password reset! go login');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.msg || 'reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>forgot password? 🤔</h1>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 1 && (
          <form onSubmit={requestReset}>
            <p>we'll send u a reset code</p>
            <div className="form-group">
              <label htmlFor="email">ur email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={loading}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-large">
              {loading ? 'sending...' : 'send reset code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={resetPassword}>
            <div className="form-group">
              <label htmlFor="code">reset code from email</label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="code"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">new password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="strong password"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">confirm it</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="same password"
                disabled={loading}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-large">
              {loading ? 'resetting...' : 'set new password'}
            </button>
          </form>
        )}

        <Link to="/login" className="link-secondary">back to login</Link>
      </div>
    </div>
  );
}

export default PasswordReset;
