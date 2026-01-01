import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function EnhancedAdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '🎮',
    color: '#87CEEB'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'users') {
        const response = await axios.get('http://localhost:3000/api/admin/users', { headers });
        setUsers(response.data);
      } else if (activeTab === 'categories') {
        const response = await axios.get('http://localhost:3000/api/categories', { headers });
        setCategories(response.data);
      } else if (activeTab === 'reports') {
        const response = await axios.get('http://localhost:3000/api/moderation/reports', { headers });
        setReports(response.data);
      } else if (activeTab === 'logs') {
        const response = await axios.get('http://localhost:3000/api/admin/audit-logs', { headers });
        setAuditLogs(response.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Access denied');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt('Ban reason:');
    if (!reason) return;

    const duration = prompt('Duration in days (leave empty for permanent):');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/admin/users/${userId}/ban`,
        { reason, duration: duration ? parseInt(duration) : null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User banned');
      fetchData();
    } catch (err) {
      alert('Ban failed');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/admin/users/${userId}/unban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User unbanned');
      fetchData();
    } catch (err) {
      alert('Unban failed');
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = prompt(`Change role from ${currentRole} to (User/Moderator/Admin):`);
    if (!newRole || !['User', 'Moderator', 'Admin'].includes(newRole)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Role updated');
      fetchData();
    } catch (err) {
      alert('Role update failed');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/categories',
        newCategory,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowCategoryModal(false);
      setNewCategory({ name: '', description: '', icon: '🎮', color: '#87CEEB' });
      fetchData();
    } catch (err) {
      alert('Category creation failed');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? All posts will be uncategorized.')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>⚙️ Admin Panel</h1>
          <button onClick={() => navigate('/')} className="btn">
            ← Back to Forum
          </button>
        </div>

        {/* Tabs */}
        <div className="feed-tabs" style={{ marginBottom: '24px' }}>
          <button
            className={`feed-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
          <button
            className={`feed-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            📁 Categories
          </button>
          <button
            className={`feed-tab ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            🚨 Reports
          </button>
          <button
            className={`feed-tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Audit Logs
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>User Management</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-primary)' }}>User</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-primary)' }}>Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-primary)' }}>Role</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-primary)' }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-primary)' }}>Joined</th>
                        <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', color: 'white' }}>
                                {user.username?.[0]?.toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{user.email}</td>
                          <td style={{ padding: '12px' }}>
                            <span className={`role-badge ${user.role.toLowerCase()}`}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {user.isActive ? (
                              <span style={{ color: '#2d7a4a', fontWeight: 600 }}>✓ Active</span>
                            ) : (
                              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>✗ Banned</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-muted)' }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleChangeRole(user._id, user.role)}
                              className="btn"
                              style={{ marginRight: '8px', padding: '6px 12px', fontSize: '12px' }}
                            >
                              Change Role
                            </button>
                            {user.isActive ? (
                              <button
                                onClick={() => handleBanUser(user._id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Ban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUnbanUser(user._id)}
                                className="btn btn-primary"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                              >
                                Unban
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ color: 'var(--text-primary)' }}>Category Management</h2>
                  <button onClick={() => setShowCategoryModal(true)} className="btn btn-primary">
                    + Add Category
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                  {categories.map(cat => (
                    <div key={cat._id} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ fontSize: '32px' }}>{cat.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{cat.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.postCount || 0} posts</div>
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{cat.description}</p>
                      <button
                        onClick={() => handleDeleteCategory(cat._id)}
                        className="btn btn-danger"
                        style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Reported Posts</h2>
                {reports.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                    No reports
                  </p>
                ) : (
                  reports.map(post => (
                    <div key={post._id} style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '16px', border: '2px solid var(--danger)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>{post.title}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                            by {post.user?.username} • {post.reportCount} reports
                          </p>
                        </div>
                        <span style={{ padding: '4px 12px', background: 'var(--danger)', color: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                          {post.reportCount} Reports
                        </span>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Reports:</strong>
                        {post.reports?.slice(0, 3).map((report, idx) => (
                          <div key={idx} style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            • {report.reason} (by {report.user?.username})
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'logs' && (
              <div style={{ background: 'var(--bg-primary)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Audit Logs</h2>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  {auditLogs.slice(0, 100).map(log => (
                    <div key={log._id} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.action}</span>
                          {' by '}
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.user?.username || 'Unknown'}</span>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Category</h2>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g. PC Gaming"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Describe this category..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Icon (Emoji)</label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="🎮"
                  maxLength="2"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  style={{ height: '40px', cursor: 'pointer' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedAdminPanel;
