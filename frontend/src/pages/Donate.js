import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Donate() {
  const [amount, setAmount] = useState('5.00');
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [card, setCard] = useState(null);
  const [payments, setPayments] = useState(null);
  const navigate = useNavigate();

  const presetAmounts = ['5.00', '10.00', '25.00', '50.00', '100.00'];

  useEffect(() => {
    initializeSquare();
  }, []);

  const initializeSquare = async () => {
    if (!window.Square) {
      console.error('Square.js failed to load');
      setMessage('Payment system loading... Please wait or refresh the page.');
      setMessageType('info');
      return;
    }

    // Check if card container element exists (only on Donate page)
    const cardContainer = document.getElementById('card-container');
    if (!cardContainer) {
      console.log('Card container not found - not on donate page');
      return;
    }

    try {
      // Initialize Square Payments with SANDBOX Application ID and Location ID
      const paymentsInstance = window.Square.payments(
        'sandbox-sq0idb-RCvy6gpNq5U5-TFjmaxAKg', // SANDBOX Application ID
        'L3B15A7B24RAA' // Location ID from your Sandbox account
      );
      setPayments(paymentsInstance);

      // Create and attach card payment method
      const cardInstance = await paymentsInstance.card();
      await cardInstance.attach('#card-container');
      setCard(cardInstance);
      // Square payment form initialized successfully
    } catch (e) {
      console.error('Failed to initialize Square:', e);
      setMessage('Failed to load payment form. Please refresh the page.');
      setMessageType('error');
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setMessage('');
    setMessageType('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login to donate');
        setMessageType('error');
        setProcessing(false);
        navigate('/login');
        return;
      }

      const donationAmount = customAmount.trim() || amount;
      
      // Validate amount
      const amountNum = parseFloat(donationAmount);
      if (isNaN(amountNum) || amountNum < 1 || amountNum > 50000) {
        setMessage('Please enter a valid amount between $1 and $50,000');
        setMessageType('error');
        setProcessing(false);
        return;
      }

      const amountInCents = Math.round(amountNum * 100);

      // Tokenize the card
      if (!card) {
        setMessage('Payment form not ready. Please refresh the page.');
        setMessageType('error');
        setProcessing(false);
        return;
      }

      const result = await card.tokenize();
      
      if (result.status === 'OK') {
        
        // Send payment to backend
        const response = await axios.post(
          'http://localhost:3000/api/payments',
          {
            amount: amountInCents,
            sourceId: result.token
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.payment?.status === 'COMPLETED' || response.status === 200) {
          setMessage(`✅ Thank you! Donation of $${amountNum.toFixed(2)} processed successfully!`);
          setMessageType('success');
          setAmount('5.00');
          setCustomAmount('');
          
          // Reset the card form
          if (card) {
            await card.destroy();
            const newCard = await payments.card();
            await newCard.attach('#card-container');
            setCard(newCard);
          }
        } else {
          setMessage('Payment status: ' + (response.data?.payment?.status || 'Processing'));
          setMessageType('info');
        }
      } else {
        console.error('Tokenization failed:', result.errors);
        const errorMessage = result.errors?.[0]?.message || 'Please check your card details';
        setMessage('Card validation failed: ' + errorMessage);
        setMessageType('error');
      }
    } catch (error) {
      console.error('Donation error:', error);
      setMessage(
        error.response?.data?.msg || 
        error.response?.data?.error ||
        'Payment failed. Please try again or contact support.'
      );
      setMessageType('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="donate-container" style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>💝 Support GameForum</h1>
        <p style={styles.subtitle}>Your donations help us maintain and improve the platform</p>

        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: messageType === 'success' ? '#d4edda' : messageType === 'error' ? '#f8d7da' : '#d1ecf1',
            color: messageType === 'success' ? '#155724' : messageType === 'error' ? '#721c24' : '#0c5460',
            borderColor: messageType === 'success' ? '#c3e6cb' : messageType === 'error' ? '#f5c6cb' : '#bee5eb'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleDonate} style={styles.form}>
          <div style={styles.amountSection}>
            <label style={styles.label}>Select Amount or Enter Custom</label>
            
            <div style={styles.presetGrid}>
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  style={{
                    ...styles.presetButton,
                    backgroundColor: amount === preset && !customAmount ? '#6366f1' : '#e5e7eb',
                    color: amount === preset && !customAmount ? 'white' : '#374151'
                  }}
                  disabled={processing}
                >
                  ${preset}
                </button>
              ))}
            </div>

            <div style={styles.customAmountSection}>
              <label style={styles.label}>or Custom Amount</label>
              <div style={styles.inputWrapper}>
                <span style={styles.currencySymbol}>$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    if (e.target.value) setAmount('5.00');
                  }}
                  placeholder="e.g., 25.50"
                  min="1"
                  max="50000"
                  step="0.01"
                  style={styles.input}
                  disabled={processing}
                />
              </div>
            </div>
          </div>

          {/* Square Card Form */}
          <div style={styles.cardSection}>
            <label style={styles.label}>💳 Card Information</label>
            <div id="card-container" style={styles.cardContainer}></div>
          </div>

          <button
            type="submit"
            disabled={processing || !card}
            style={{
              ...styles.submitButton,
              opacity: (processing || !card) ? 0.6 : 1,
              cursor: (processing || !card) ? 'not-allowed' : 'pointer'
            }}
          >
            {processing ? 'Processing...' : !card ? 'Loading...' : `Donate $${customAmount || amount}`}
          </button>
        </form>

        <div style={styles.securityNote}>
          <p style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center', margin: 0 }}>
            🔒 Secured by Square • Your card information is encrypted and never stored on our servers
          </p>
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
    width: '100%'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center',
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '30px'
  },
  message: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid',
    fontSize: '14px'
  },
  form: {
    marginBottom: '20px'
  },
  amountSection: {
    marginBottom: '25px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#374151'
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    marginBottom: '20px'
  },
  presetButton: {
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  customAmountSection: {
    marginTop: '20px'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  currencySymbol: {
    position: 'absolute',
    left: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#6b7280'
  },
  input: {
    width: '100%',
    padding: '12px 12px 12px 32px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  cardSection: {
    marginBottom: '20px'
  },
  cardContainer: {
    minHeight: '90px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '12px',
    backgroundColor: '#ffffff'
  },
  submitButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    marginBottom: '20px',
    transition: 'background-color 0.2s'
  },
  securityNote: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px'
  }
};

export default Donate;
