import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Donate() {
  const [amount, setAmount] = useState('5.00');
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const presetAmounts = ['5.00', '10.00', '25.00', '50.00', '100.00'];

  const handleDonate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to donate');
        navigate('/login');
        return;
      }

      const donationAmount = customAmount || amount;
      const amountInCents = Math.round(parseFloat(donationAmount) * 100);

      // In production, you'd integrate with Square payment form
      // For now, we'll simulate the payment
      const response = await axios.post(
        'http://localhost:3000/api/payments',
        {
          amount: amountInCents,
          sourceId: 'cnon:card-nonce-ok' // Square test nonce
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Thank you for your donation! 🎉');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Donation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
              💝 Support Our Community
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Help us keep the servers running and the community thriving!
            </p>
          </div>

          {message && (
            <div className={`alert ${message.includes('Thank you') ? 'alert-success' : 'alert-error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleDonate}>
            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', display: 'block' }}>
                Select Amount
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                {presetAmounts.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount('');
                    }}
                    className={amount === preset && !customAmount ? 'btn btn-primary' : 'btn'}
                    style={{ padding: '12px', fontSize: '16px', fontWeight: 600 }}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="customAmount">Or Enter Custom Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '16px', fontWeight: 600 }}>
                  $
                </span>
                <input
                  type="number"
                  id="customAmount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  step="0.01"
                  style={{ paddingLeft: '32px', fontSize: '16px' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Donation Amount:</span>
                <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>
                  ${customAmount || amount}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
                💡 Your donation helps us maintain servers, improve features, and keep the community ad-free!
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={processing || (!amount && !customAmount)}
              style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700 }}
            >
              {processing ? 'Processing...' : `Donate $${customAmount || amount}`}
            </button>

            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn"
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            >
              ← Back to Forum
            </button>
          </form>

          <div style={{ marginTop: '32px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
              Why Donate?
            </h3>
            <ul style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Keep the servers running 24/7</li>
              <li>Support new feature development</li>
              <li>Maintain an ad-free experience</li>
              <li>Help moderate and improve the community</li>
              <li>Get a special donor badge (coming soon!)</li>
            </ul>
          </div>

          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
            🔒 Secure payment processing powered by Square
          </p>
        </div>
      </div>
    </div>
  );
}

export default Donate;
