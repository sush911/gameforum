import React, { useState } from 'react';
import axios from 'axios';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setFormData({
        bio: response.data.bio || '',
        avatar: response.data.avatar || '',
        profilePrivate: response.data.profilePrivate || false
      });
    } catch (err) {
      setError('Failed to load profile');
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
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3000/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Profile updated successfully');
      setEditing(false);
      fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <h2>User Profile</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!editing ? (
        <div className="profile-view">
          <div className="profile-header">
            <div className="profile-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.username} />
              ) : (
                <div className="default-avatar">{user.username[0]}</div>
              )}
            </div>
            <div className="profile-info">
              <h3>{user.username}</h3>
              <p className="email">{user.email}</p>
              <p className="role">Role: {user.role}</p>
            </div>
          </div>

          <div className="profile-details">
            <p><strong>Bio:</strong> {user.bio || 'No bio added'}</p>
            <p>
              <strong>Privacy:</strong>
              <span className="privacy-badge">
                {user.profilePrivate ? '🔒 Private' : '🌐 Public'}
              </span>
            </p>
            <p><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <p><strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
          </div>

          <button onClick={() => setEditing(true)} className="btn btn-primary">
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength="500"
              placeholder="Tell us about yourself..."
              aria-label="User biography"
            />
            <small>{formData.bio.length}/500</small>
          </div>

          <div className="form-group">
            <label htmlFor="avatar">Avatar URL</label>
            <input
              type="url"
              id="avatar"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://example.com/avatar.jpg"
              aria-label="Avatar image URL"
            />
            {formData.avatar && (
              <img src={formData.avatar} alt="Avatar preview" className="avatar-preview" />
            )}
          </div>

          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="profilePrivate"
              name="profilePrivate"
              checked={formData.profilePrivate}
              onChange={handleChange}
              aria-label="Make profile private"
            />
            <label htmlFor="profilePrivate">Make profile private</label>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default UserProfile;
