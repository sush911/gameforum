import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function PasswordReset() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:3000/api/users/password/reset-request', { email });
      setSuccess('Check your email for reset code');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/users/password/reset', {
        email,
        code,
        newPassword
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Reset Password</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {step === 1 && (
        <form onSubmit={requestReset}>
          <p>Enter your email address to receive a password reset code.</p>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
              required
              aria-label="Email address for password reset"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={resetPassword}>
          <div className="form-group">
            <label htmlFor="code">Reset Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code from email"
              disabled={loading}
              required
              aria-label="Password reset code"
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              disabled={loading}
              required
              aria-label="New password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
              required
              aria-label="Confirm new password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default PasswordReset;
