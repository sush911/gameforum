import React, { useState } from 'react';

function MFASetup({ userEmail, onMFAEnabled }) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const setupMFA = async () => {
    setLoading(true);
    setError('');

    try {
      const jwtToken = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('MFA setup failed');

      const data = await response.json();
      setSecret(data.secret);
      setQrCode(data.qrCode);
      setBackupCodes(data.backupCodes);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enableMFA = async () => {
    setLoading(true);
    setError('');

    if (!token || token.length !== 6) {
      setError('Please enter a 6-digit code');
      setLoading(false);
      return;
    }

    try {
      const jwtToken = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/users/mfa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ secret, backupCodes, token })
      });

      if (!response.ok) throw new Error('MFA verification failed');

      setStep(3);
      if (onMFAEnabled) onMFAEnabled();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mfa-setup modal">
      <div className="modal-content">
        <h2>Set Up Two-Factor Authentication</h2>

        {step === 1 && (
          <div>
            <p>Two-Factor Authentication adds an extra layer of security to your account.</p>
            <button
              onClick={setupMFA}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Setting up...' : 'Start Setup'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Scan QR Code</h3>
            <p>Use an authenticator app like Google Authenticator or Authy:</p>
            {qrCode && <img src={qrCode} alt="MFA QR Code" className="qr-code" />}

            <p className="or-text">Or enter manually:</p>
            <code className="secret-key">{secret}</code>

            <h3>Verify Code</h3>
            <p>Enter the 6-digit code from your authenticator app:</p>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              className="mfa-input"
              aria-label="MFA verification code"
            />

            {error && <p className="error">{error}</p>}

            <button
              onClick={enableMFA}
              disabled={loading || token.length !== 6}
              className="btn btn-primary"
            >
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>MFA Enabled Successfully! ✓</h3>
            <p>Save your backup codes in a secure place. You can use them to access your account if you lose access to your authenticator app.</p>

            <div className="backup-codes">
              {backupCodes.map((code, idx) => (
                <code key={idx}>{code}</code>
              ))}
            </div>

            <button
              onClick={copyBackupCodes}
              className="btn btn-secondary"
            >
              {copied ? 'Copied!' : 'Copy Backup Codes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MFASetup;
