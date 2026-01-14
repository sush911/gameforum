import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolution, setResolution] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? 'http://localhost:3000/api/admin/reports'
        : `http://localhost:3000/api/admin/reports?status=${filter}`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId, status) => {
    if (!resolution.trim() && status === 'resolved') {
      alert('Please enter a resolution');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/admin/reports/${reportId}/resolve`,
        { status, resolution: resolution.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResolution('');
      setSelectedReport(null);
      fetchReports();
      alert('Report resolved');
    } catch (err) {
      console.error('Failed to resolve report:', err);
      alert('Failed to resolve report');
    }
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      spam: 'Spam',
      harassment: 'Harassment',
      hate_speech: 'Hate Speech',
      misinformation: 'Misinformation',
      adult_content: 'Adult Content',
      violence: 'Violence',
      copyright: 'Copyright',
      other: 'Other'
    };
    return reasons[reason] || reason;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      investigating: '#3b82f6',
      resolved: '#10b981',
      dismissed: '#6b7280'
    };
    return colors[status] || '#gray';
  };

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Reported Content</h2>
        <p>Manage user reports and take moderation actions</p>
      </div>

      {/* FILTER TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['pending', 'investigating', 'resolved', 'dismissed', 'all'].map(status => (
          <button
            key={status}
            className={`btn ${filter === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>Loading reports...</div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <p>No reports found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {reports.map(report => (
            <div
              key={report._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#f9f9f9'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px 0' }}>
                    {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Report
                  </h4>
                  <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                    By {report.reportedBy?.username || 'Unknown'} • {new Date(report.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    backgroundColor: getStatusColor(report.status),
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {report.status.toUpperCase()}
                </span>
              </div>

              <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '4px' }}>
                <strong>Reason:</strong> {getReasonLabel(report.reason)}
                {report.description && (
                  <>
                    <br />
                    <strong>Details:</strong> {report.description}
                  </>
                )}
              </div>

              {selectedReport === report._id ? (
                <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '8px' }}>
                    <strong>Resolution:</strong>
                  </label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Explain the action taken..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      marginBottom: '8px',
                      fontFamily: 'inherit'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleResolveReport(report._id, 'resolved')}
                    >
                      Resolve
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleResolveReport(report._id, 'dismissed')}
                    >
                      Dismiss
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedReport(null);
                        setResolution('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setSelectedReport(report._id)}
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminReports;
