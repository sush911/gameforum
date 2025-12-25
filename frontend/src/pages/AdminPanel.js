import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tab === 'users') {
      fetchUsers();
    } else {
      fetchLogs();
    }
  }, [tab]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      setError('failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/users/activity-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (err) {
      setError('failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const lockUser = async (userId) => {
    if (!window.confirm('lock this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3000/api/admin/users/${userId}/lock`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      setError('couldnt lock user');
    }
  };

  return (
    <div className="admin-panel">
      <h1>admin stuff 🔐</h1>

      <div className="admin-tabs">
        <button 
          className={`tab ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          users
        </button>
        <button 
          className={`tab ${tab === 'logs' ? 'active' : ''}`}
          onClick={() => setTab('logs')}
        >
          activity logs
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tab === 'users' && (
        <div className="admin-section">
          <h2>all users ({users.length})</h2>
          {loading && <p>loading...</p>}
          {!loading && users.length === 0 && <p>no users found</p>}
          {!loading && users.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>username</th>
                  <th>email</th>
                  <th>role</th>
                  <th>joined</th>
                  <th>action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td><span className="role-badge">{user.role}</span></td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      {user.role !== 'Admin' && (
                        <button 
                          className="btn-small btn-danger"
                          onClick={() => lockUser(user._id)}
                        >
                          lock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="admin-section">
          <h2>activity logs ({logs.length})</h2>
          {loading && <p>loading...</p>}
          {!loading && logs.length === 0 && <p>no activity yet</p>}
          {!loading && logs.length > 0 && (
            <div className="logs-list">
              {logs.map(log => (
                <div key={log._id} className="log-item">
                  <span className="log-action">{log.action}</span>
                  <span className="log-user">{log.user?.username}</span>
                  <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminPanel;







