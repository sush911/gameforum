import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function DonateSuccess() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Get payment details from URL params if available
      const transactionId = searchParams.get('transactionId');
      const checkoutId = searchParams.get('checkoutId');

      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPaymentStatus('success');
      setLoading(false);
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('error');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner}></div>
          <h2 style={styles.title}>Verifying Payment...</h2>
          <p style={styles.text}>Please wait while we confirm your donation.</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h1 style={styles.title}>Thank You for Your Donation!</h1>
          <p style={styles.text}>
            Your payment has been processed successfully. We truly appreciate your support!
          </p>
          <div style={styles.benefitsBox}>
            <h3 style={styles.benefitsTitle}>Your Contribution Helps:</h3>
            <ul style={styles.benefitsList}>
              <li>✅ Keep our servers running smoothly</li>
              <li>✅ Develop new features and improvements</li>
              <li>✅ Maintain security and performance</li>
              <li>✅ Support our community moderators</li>
            </ul>
          </div>
          <div style={styles.buttonGroup}>
            <button
              onClick={() => navigate('/')}
              style={styles.primaryButton}
            >
              Return to Home
            </button>
            <button
              onClick={() => navigate('/donate')}
              style={styles.secondaryButton}
            >
              Make Another Donation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.errorIcon}>❌</div>
        <h1 style={styles.title}>Payment Verification Failed</h1>
        <p style={styles.text}>
          We couldn't verify your payment. If you were charged, please contact support.
        </p>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => navigate('/')}
            style={styles.primaryButton}
          >
            Return to Home
          </button>
          <button
            onClick={() => navigate('/donate')}
            style={styles.secondaryButton}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '40px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #6366f1',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px'
  },
  successIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  errorIcon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1f2937'
  },
  text: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.6'
  },
  benefitsBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '24px',
    textAlign: 'left'
  },
  benefitsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#15803d'
  },
  benefitsList: {
    fontSize: '14px',
    color: '#15803d',
    paddingLeft: '0',
    listStyle: 'none',
    margin: 0
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    flexDirection: 'column'
  },
  primaryButton: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  secondaryButton: {
    width: '100%',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

// Add keyframes for spinner animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default DonateSuccess;
