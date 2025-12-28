import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user || response.data;
      setUser(userData);
      
      // Check if this is a new user that just registered
      const newUserData = localStorage.getItem('newUserData');
      if (newUserData && !userData.bio) {
        const storedData = JSON.parse(newUserData);
        setFormData({
          bio: storedData.bio || '',
          avatar: storedData.avatar || '',
          profilePrivate: storedData.profilePrivate || false
        });
        // Clear the new user data flag
        localStorage.removeItem('newUserData');
      } else {
        setFormData({
          bio: userData.bio || '',
          avatar: userData.avatar || '',
          profilePrivate: userData.profilePrivate || false
        });
      }
    } catch (err) {
      setError('failed to load profile');
    }
  };

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3000/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditing(false);
      fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.msg || 'update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>loading...</div>;

  return (
    <div className="profile-container">
      <h1>ur profile</h1>

      {error && <div className="alert alert-error">{error}</div>}

      {!editing ? (
        <div className="profile-view">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <div className="default-avatar">{user.username ? user.username[0].toUpperCase() : '?'}</div>
              )}
            </div>
            <div className="profile-info">
              <h2>{user.username}</h2>
              <p>{user.email}</p>
              <p>role: {user.role}</p>
            </div>
          </div>

          <div className="profile-details">
            <p><strong>bio:</strong> {user.bio || 'no bio yet'}</p>
            <p>
              <strong>privacy:</strong>
              {user.profilePrivate ? ' 🔒 private' : ' 🌐 public'}
            </p>
            <p><strong>joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>

          <button onClick={() => setEditing(true)} className="btn btn-primary">
            edit
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="bio">bio (what u about)</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength="500"
              placeholder="tell ppl about urself..."
              rows="4"
            />
            <small>{formData.bio.length}/500</small>
          </div>

          <div className="form-group">
            <label htmlFor="avatar">avatar url</label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/pic.jpg"
            />
            {formData.avatar && (
              <img src={formData.avatar} alt="preview" className="avatar-preview" />
            )}
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="profilePrivate"
              name="profilePrivate"
              checked={formData.profilePrivate}
              onChange={handleChange}
            />
            <label htmlFor="profilePrivate">keep it private</label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'saving...' : 'save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError('');
              }}
              className="btn btn-secondary"
            >
              cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default UserProfile;
