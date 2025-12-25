import React, { useState, useEffect } from 'react';

function PasswordStrengthMeter({ password }) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setFeedback('');
      return;
    }

    let score = 0;
    const feedbackList = [];

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedbackList.push('Add lowercase letters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedbackList.push('Add uppercase letters');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedbackList.push('Add numbers');
    }

    if (/[\W_]/.test(password)) {
      score += 1;
    } else {
      feedbackList.push('Add special characters (!@#$%^&*)');
    }

    setStrength(Math.min(score, 7));
    setFeedback(feedbackList);
  }, [password]);

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Fair';
    if (strength <= 5) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 2) return '#e74c3c';
    if (strength <= 4) return '#f39c12';
    if (strength <= 5) return '#f1c40f';
    return '#27ae60';
  };

  if (!password) return null;

  return (
    <div className="password-strength-meter">
      <div className="strength-bar-container">
        <div
          className="strength-bar"
          style={{
            width: `${(strength / 7) * 100}%`,
            backgroundColor: getStrengthColor(),
            transition: 'all 0.3s ease'
          }}
        />
      </div>
      <p className="strength-label" style={{ color: getStrengthColor() }}>
        Strength: {getStrengthLabel()}
      </p>
      {feedback.length > 0 && (
        <ul className="strength-feedback">
          {feedback.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
