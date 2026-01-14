import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiCalendar, FiEdit2, FiCamera, FiShield, FiCheck, FiX, FiUpload } from 'react-icons/fi';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('recent');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchUserPosts();
  }, [sortBy, currentPage]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || ''
      });
      setMfaEnabled(userData.mfa_enabled || false);
    } catch (err) {
      setError('Failed to load profile');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/users/me/posts', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 10, sort: sortBy }
      });
      setPosts(response.data.posts);
      setTotalPages(response.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      setError('Please select an image first');
      return;
    }

    setUploadingAvatar(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await axios.post(
        'http://localhost:3000/api/users/avatar/upload',
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      setUser(response.data.user);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess('Profile picture updated successfully!');
      window.dispatchEvent(new Event('authChange'));
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err.response?.data?.msg || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.bio.trim()) {
      setError('Bio is required');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:3000/api/users/profile',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(response.data.user);
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  if (loading && !user) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTop: '4px solid #0079D3', borderRadius: '50%' }}
          />
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2>Could not load profile</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          {/* Cover Banner */}
          <div style={{ height: '160px', background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: '-60px', left: '40px' }}>
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '6px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 700,
                  color: '#0079D3',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  {(avatarPreview || user.avatar) ? (
                    <img 
                      src={avatarPreview || `http://localhost:3000${user.avatar}`} 
                      alt={user.username} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    <span>{user.username[0]?.toUpperCase()}</span>
                  )}
                </div>
                <label style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#0079D3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <FiCamera size={20} color="white" />
                  <input
                    type="file"
                    onChange={handleAvatarSelect}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div style={{ padding: '80px 40px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>{user.username}</h1>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#666' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiMail size={16} />
                    {user.email}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCalendar size={16} />
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiShield size={16} />
                    {user.role}
                  </span>
                </div>
              </div>
              {avatarFile && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: uploadingAvatar ? 0.6 : 1
                  }}
                >
                  <FiUpload size={18} />
                  {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                </motion.button>
              )}
            </div>

            {user.bio && (
              <p style={{ fontSize: '16px', color: '#333', lineHeight: '1.6', marginBottom: '20px' }}>
                {user.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0079D3', marginBottom: '4px' }}>
                  {user.postCount || 0}
                </div>
                <div style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>Posts</div>
              </div>
              <div style={{ padding: '16px 24px', background: 'linear-gradient(135deg, #f6f7f9 0%, #e9ecef 100%)', borderRadius: '12px', flex: 1 }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#0079D3', marginBottom: '4px' }}>
                  {mfaEnabled ? '✓' : '✗'}
                </div>
                <div style={{ fontSize: '13px', color: '#666', fontWeight: 600 }}>2FA Status</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ padding: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '12px', marginBottom: '24px', color: '#c00', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <FiX size={20} />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ padding: '16px', background: '#efe', border: '1px solid #cfc', borderRadius: '12px', marginBottom: '24px', color: '#060', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <FiCheck size={20} />
            {success}
          </motion.div>
        )}

        {/* Edit Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '16px', padding: '32px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiUser size={24} style={{ color: '#0079D3' }} />
              Profile Information
            </h2>
            {!editing && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(true)}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiEdit2 size={16} />
                Edit Profile
              </motion.button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Tell us about yourself..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '14px 16px',
                    fontSize: '15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    background: '#e0e0e0',
                    color: '#333',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          ) : (
            <div style={{ fontSize: '16px', color: '#333', lineHeight: '1.8' }}>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Bio:</strong> {user.bio || 'No bio added yet'}</p>
            </div>
          )}
        </motion.div>

        {/* User Posts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 700 }}>My Posts ({user?.postCount || 0})</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSortBy('recent'); setCurrentPage(1); }}
                style={{
                  padding: '10px 20px',
                  background: sortBy === 'recent' ? 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)' : '#f6f7f9',
                  color: sortBy === 'recent' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                🆕 Recent
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSortBy('popular'); setCurrentPage(1); }}
                style={{
                  padding: '10px 20px',
                  background: sortBy === 'popular' ? 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)' : '#f6f7f9',
                  color: sortBy === 'popular' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '14px'
                }}
              >
                🔥 Popular
              </motion.button>
            </div>
          </div>

          {postsLoading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTop: '4px solid #0079D3', borderRadius: '50%', margin: '0 auto' }}
              />
              <p style={{ marginTop: '16px', color: '#666' }}>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>No posts yet</h3>
              <p style={{ color: '#666' }}>Start sharing your thoughts with the community!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard
                      post={post}
                      currentUser={user}
                      onUpdate={fetchUserPosts}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '32px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '10px 20px',
                      background: currentPage === 1 ? '#e0e0e0' : 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                      color: currentPage === 1 ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Previous
                  </motion.button>
                  <span style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '10px 20px',
                      background: currentPage === totalPages ? '#e0e0e0' : 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                      color: currentPage === totalPages ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Next
                  </motion.button>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default UserProfile;
