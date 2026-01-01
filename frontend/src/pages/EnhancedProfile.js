import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function EnhancedProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
      setFormData({
        bio: userData.bio || '',
        profilePrivate: userData.profilePrivate || false
      });
    } catch (err) {
      setError('Failed to load profile');
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/upload/avatar',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccess('Avatar updated!');
      setAvatarFile(null);
      setAvatarPreview(null);
      fetchUserProfile();
    } catch (err) {
      setError('Avatar upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3000/api/users/profile',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Profile updated!');
      setEditing(false);
      fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.msg || 'Update failed');
    }
  };

  if (!user) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800 }}>Your Profile</h1>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            ← Back to Forum
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Avatar Section */}
        <div className="create-post-card" style={{ marginBottom: '20px' }}>
          <h2 style={{ marginBottom: '20px' }}>Profile Picture</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 700, overflow: 'hidden' }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : user.avatar ? (
                <img src={`http://localhost:3000${user.avatar}`} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.username?.[0]?.toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                style={{ marginBottom: '12px' }}
              />
              {avatarFile && (
                <button
                  onClick={handleAvatarUpload}
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? 'Uploading...' : 'Upload Avatar'}
                </button>
              )}
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="create-post-card">
          <h2 style={{ marginBottom: '20px' }}>Profile Information</h2>
          
          {!editing ? (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Username
                </label>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{user.username}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Email
                </label>
                <div style={{ fontSize: '16px' }}>{user.email}</div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Role
                </label>
                <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Bio
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                  {user.bio || 'No bio yet'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Privacy
                </label>
                <div style={{ fontSize: '15px' }}>
                  {user.profilePrivate ? '🔒 Private' : '🌐 Public'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Member Since
                </label>
                <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>

              <button onClick={() => setEditing(true)} className="btn btn-primary">
                Edit Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  maxLength="500"
                  rows="4"
                  placeholder="Tell us about yourself..."
                />
                <small>{formData.bio.length}/500</small>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.profilePrivate}
                    onChange={(e) => setFormData({ ...formData, profilePrivate: e.target.checked })}
                  />
                  <span>Make profile private</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="btn btn-primary">
                  Save Changes
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
      </div>
    </div>
  );
}

export default EnhancedProfile;
