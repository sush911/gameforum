import React from 'react';

function PasswordStrengthMeter({ strength }) {
  const getStrengthColor = () => {
    switch (strength) {
      case 1: return 'var(--error)';
      case 2: return 'var(--warning)';
      case 3: return '#3b82f6';
      case 4: return 'var(--success)';
      default: return 'var(--bg-tertiary)';
    }
  };

  const getStrengthLabel = () => {
    switch (strength) {
      case 1: return 'Weak';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="strength-meter">
      <div className="strength-bar">
        <div
          className="strength-fill"
          style={{
            width: `${strength * 25}%`,
            backgroundColor: getStrengthColor()
          }}
        />
      </div>
      {strength > 0 && (
        <div className="strength-text" style={{ color: getStrengthColor() }}>
          {getStrengthLabel()}
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;
