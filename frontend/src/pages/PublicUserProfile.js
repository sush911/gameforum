import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PostCard from '../components/PostCard';
import Navbar from '../components/Navbar';

function PublicUserProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchCurrentUser();
    fetchUserProfile();
    fetchUserPosts();
  }, [identifier, sortBy, currentPage]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCurrentUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:3000/api/users/${identifier}/profile`);
      setUser(response.data.user);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('User not found');
      } else if (err.response?.status === 403) {
        setError('This profile is private');
      } else {
        setError('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/users/${identifier}/posts`, {
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

  if (loading) {
    return (
      <>
        <Navbar user={currentUser} handleLogout={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }} />
        <div className="profile-container">
          <div className="loading">Loading profile...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar user={currentUser} handleLogout={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }} />
        <div className="profile-container">
          <div className="alert alert-error">{error}</div>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Go Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={currentUser} handleLogout={() => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      }} />
      <div className="profile-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Profile Header Card */}
        <div style={{ background: 'white', border: '1px solid var(--reddit-border)', borderRadius: '8px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--reddit-blue)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {user.avatar ? (
                <img 
                  src={`http://localhost:3000${user.avatar}`} 
                  alt={user.username} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span>{user.username[0]?.toUpperCase()}</span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>{user.username}</h1>
              <p style={{ color: 'var(--reddit-gray)', fontSize: '14px', marginBottom: '12px' }}>@{user.username}</p>
              
              {user.bio && (
                <p style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>{user.bio}</p>
              )}
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: 'var(--reddit-gray)' }}>
                <span>🎂 Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>📝 {user.postCount || 0} posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div style={{ background: 'white', border: '1px solid var(--reddit-border)', borderRadius: '8px', padding: '16px' }}>
          {/* Sort Options */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--reddit-border)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Posts</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setSortBy('recent'); setCurrentPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: sortBy === 'recent' ? 'var(--reddit-blue)' : 'transparent',
                  color: sortBy === 'recent' ? 'white' : 'var(--reddit-gray)',
                  border: '1px solid var(--reddit-border)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🆕 New
              </button>
              <button
                onClick={() => { setSortBy('popular'); setCurrentPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: sortBy === 'popular' ? 'var(--reddit-blue)' : 'transparent',
                  color: sortBy === 'popular' ? 'white' : 'var(--reddit-gray)',
                  border: '1px solid var(--reddit-border)',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔥 Top
              </button>
            </div>
          </div>

          {/* Posts */}
          {postsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--reddit-gray)' }}>Loading posts...</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--reddit-gray)' }}>
              No posts yet
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={currentUser}
                    onUpdate={fetchUserPosts}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '8px 16px', display: 'flex', alignItems: 'center' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default PublicUserProfile;
