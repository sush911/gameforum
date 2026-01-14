import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';

function CommunityPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [community, setCommunity] = useState(null);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('new');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchCategories();
    fetchCommunity();
    fetchPosts();
  }, [slug, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchCommunity = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/categories/${slug}`);
      setCommunity(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch community:', err);
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get('http://localhost:3000/api/posts', { headers });
      
      // Filter posts by category
      const filteredPosts = response.data.filter(post => {
        if (post.category) {
          const categorySlug = typeof post.category === 'object' ? post.category.slug : post.category;
          return categorySlug === slug;
        }
        return false;
      });

      // Sort posts
      const sortedPosts = sortBy === 'new' 
        ? filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : filteredPosts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

      setPosts(sortedPosts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      alert('Please login to join communities');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/categories/${community._id}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoined(true);
      fetchCommunity();
    } catch (err) {
      console.error('Failed to join community:', err);
    }
  };

  const handleLeaveCommunity = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/categories/${community._id}/leave`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setJoined(false);
      fetchCommunity();
    } catch (err) {
      console.error('Failed to leave community:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} handleLogout={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }} />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p>Loading community...</p>
        </div>
      </>
    );
  }

  if (!community) {
    return (
      <>
        <Navbar user={user} handleLogout={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }} />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h2>Community not found</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '20px' }}>
            Go Home
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar user={user} handleLogout={() => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      }} />

      {/* Community Header with Cover */}
      <div style={{ marginBottom: '20px' }}>
        {/* Cover Image or Gradient */}
        <div style={{
          height: '200px',
          background: community.coverImage 
            ? `url(http://localhost:3000${community.coverImage}) center/cover`
            : `linear-gradient(135deg, ${community.color || '#0079D3'} 0%, ${community.color || '#0056A3'} 100%)`,
          position: 'relative'
        }} />
        
        {/* Community Info */}
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e0e0e0',
          padding: '20px',
          marginTop: '-60px',
          position: 'relative'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', marginBottom: '16px' }}>
              {/* Avatar */}
              {community.icon ? (
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '50px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '4px solid white'
                }}>
                  {community.icon}
                </div>
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  background: community.color || '#0079D3',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  fontWeight: 700,
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '4px solid white'
                }}>
                  {community.name[0]?.toUpperCase()}
                </div>
              )}
              
              <div style={{ flex: 1, paddingTop: '20px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px', color: '#1a1a1a' }}>
                  {community.name}
                </h1>
                <p style={{ fontSize: '14px', color: '#666' }}>{community.description}</p>
              </div>
              
              <button
                onClick={joined ? handleLeaveCommunity : handleJoinCommunity}
                style={{
                  padding: '10px 28px',
                  background: joined ? '#f3f4f6' : community.color || '#0079D3',
                  color: joined ? '#374151' : 'white',
                  border: 'none',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '20px'
                }}
              >
                {joined ? 'Joined ✓' : 'Join'}
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#666', paddingLeft: '120px' }}>
              <span>📝 {community.postCount || 0} posts</span>
              <span>👥 {community.members?.length || 0} members</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
          {/* Posts Feed */}
          <div>
            {/* Sort Options */}
            <div style={{
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setSortBy('new')}
                style={{
                  padding: '8px 16px',
                  background: sortBy === 'new' ? '#0079D3' : 'transparent',
                  color: sortBy === 'new' ? 'white' : '#1c1c1c',
                  border: '1px solid #ccc',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🆕 New
              </button>
              <button
                onClick={() => setSortBy('top')}
                style={{
                  padding: '8px 16px',
                  background: sortBy === 'top' ? '#0079D3' : 'transparent',
                  color: sortBy === 'top' ? 'white' : '#1c1c1c',
                  border: '1px solid #ccc',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔥 Top
              </button>
            </div>

            {/* Posts */}
            {posts.length === 0 ? (
              <div style={{
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '60px 20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h3 style={{ marginBottom: '8px' }}>No posts yet</h3>
                <p style={{ color: '#878A8C', marginBottom: '20px' }}>
                  Be the first to post in {community.name}!
                </p>
                {user && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    Create Post
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    onUpdate={fetchPosts}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <div style={{
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              position: 'sticky',
              top: '80px'
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700 }}>
                About Community
              </h3>
              <p style={{ fontSize: '14px', color: '#1c1c1c', marginBottom: '16px' }}>
                {community.description}
              </p>
              <div style={{
                padding: '12px',
                background: '#f6f7f8',
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#878A8C' }}>Posts</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{community.postCount || 0}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#878A8C' }}>Members</span>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{community.members?.length || 0}</span>
                </div>
              </div>
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#0079D3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && community && (
        <CreatePostModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={() => {
            setShowCreateModal(false);
            fetchPosts();
          }}
          preselectedCategory={community._id}
          preselectedCommunityName={community.name}
          preselectedCommunityIcon={community.icon}
        />
      )}
    </>
  );
}

export default CommunityPage;
