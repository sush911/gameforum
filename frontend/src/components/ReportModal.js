import React, { useState } from 'react';
import axios from 'axios';

function ReportModal({ postId, onClose }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reportReasons = [
    { value: 'nsfw', label: 'NSFW', icon: '🔞' },
    { value: 'violence', label: 'Violent or repulsive content', icon: '⚠️' },
    { value: 'hate', label: 'Hateful or abusive content', icon: '😡' },
    { value: 'harassment', label: 'Harassment or bullying', icon: '🚫' },
    { value: 'harmful', label: 'Harmful or dangerous acts', icon: '☠️' },
    { value: 'selfharm', label: 'Suicide, self-harm or eating disorders', icon: '💔' },
    { value: 'misinformation', label: 'Misinformation', icon: '❌' },
    { value: 'spam', label: 'Spam or misleading', icon: '📧' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      alert('Please select a reason');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/posts/${postId}/report`,
        { reason: selectedReason, details },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Report failed:', err);
      alert('Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}
        >
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ marginBottom: '8px', color: '#333' }}>Report Submitted</h2>
              <p style={{ color: '#666' }}>Thank you for helping keep our community safe.</p>
            </div>
          ) : (
            <>
              <h2 style={{ marginBottom: '8px', color: '#333' }}>Report Post</h2>
              <p style={{ marginBottom: '24px', color: '#666', fontSize: '14px' }}>
                Help us understand what's wrong with this post
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#333' }}>
                    Select a reason:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reportReasons.map((reason) => (
                      <label
                        key={reason.value}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: `2px solid ${selectedReason === reason.value ? '#0084ff' : '#e0e0e0'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: selectedReason === reason.value ? '#f0f8ff' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={reason.value}
                          checked={selectedReason === reason.value}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          style={{ marginRight: '12px' }}
                        />
                        <span style={{ marginRight: '8px', fontSize: '20px' }}>{reason.icon}</span>
                        <span style={{ color: '#333', fontSize: '14px' }}>{reason.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#333' }}>
                    Additional details (optional):
                  </label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide more context about why you're reporting this..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      minHeight: '80px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    style={{
                      padding: '10px 20px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: '#333',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !selectedReason}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: submitting || !selectedReason ? '#ccc' : '#ff4444',
                      color: 'white',
                      cursor: submitting || !selectedReason ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default ReportModal;
