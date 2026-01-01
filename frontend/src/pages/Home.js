import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';

function Home() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('new');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchPosts();
    fetchUser();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user || response.data);
    } catch (err) {
      console.error('Failed to fetch user');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:3000/api/posts';
      
      if (selectedCategory) {
        url = `http://localhost:3000/api/posts/category/${selectedCategory.slug}`;
      }
      
      const response = await axios.get(url);
      let fetchedPosts = response.data;
      
      // Filter by search query
      if (searchQuery.trim()) {
        fetchedPosts = fetchedPosts.filter(post => 
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Sort posts
      if (sortBy === 'hot') {
        fetchedPosts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      } else if (sortBy === 'top') {
        fetchedPosts.sort((a, b) => b.upvotes - a.upvotes);
      }
      
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    fetchPosts();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="App">
      {/* Header */}
      <header className="modern-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <span className="logo-icon">🎮</span>
            <span>GameForum</span>
          </Link>
          
          {/* Search Bar */}
          <div style={{ flex: 1, maxWidth: '500px', margin: '0 20px' }}>
            <input
              type="text"
              placeholder="🔍 Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'var(--surface-light)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>
          
          <nav className="header-nav">
            {user ? (
              <>
                <Link to="/donate" className="btn" style={{ background: 'var(--warning)', borderColor: 'var(--warning)', color: 'white' }}>
                  💝 Donate
                </Link>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                  + Create Post
                </button>
                <Link to="/profile" className="user-menu">
                  <div className="user-avatar-small">
                    {user.avatar ? (
                      <img src={`http://localhost:3000${user.avatar}`} alt={user.username} />
                    ) : (
                      user.username?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span>{user.username}</span>
                </Link>
                {(user.role === 'Admin' || user.role === 'Moderator') && (
                  <Link to="/admin" className="nav-btn">
                    ⚙️ Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="nav-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-btn">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-layout">
        {/* Categories Sidebar */}
        <aside className="categories-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Categories</div>
            
            <div
              className={`category-item ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <div className="category-icon">🏠</div>
              <div className="category-info">
                <div className="category-name">All Posts</div>
              </div>
            </div>
            
            {categories.map(cat => (
              <div
                key={cat._id}
                className={`category-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  '--cat-color': cat.color
                }}
              >
                <div className="category-icon" style={{ background: cat.color + '20' }}>
                  {cat.icon}
                </div>
                <div className="category-info">
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat.postCount || 0} posts</div>
                </div>
              </div>
            ))}
          </div>

          {user && (
            <div className="sidebar-section">
              <div className="sidebar-title">Your Profile</div>
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <div className="user-avatar-small" style={{ width: '64px', height: '64px', margin: '0 auto 12px', fontSize: '24px' }}>
                  {user.avatar ? (
                    <img src={`http://localhost:3000${user.avatar}`} alt={user.username} />
                  ) : (
                    user.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{user.username}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                {user.role !== 'User' && (
                  <div className={`role-badge ${user.role.toLowerCase()}`} style={{ marginTop: '8px' }}>
                    {user.role}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Feed */}
        <main className="feed-container">
          <div className="feed-header">
            <h1 className="feed-title">
              {selectedCategory ? selectedCategory.name : 'All Posts'}
            </h1>
            
            <div className="feed-tabs">
              <button
                className={`feed-tab ${sortBy === 'new' ? 'active' : ''}`}
                onClick={() => setSortBy('new')}
              >
                🆕 New
              </button>
              <button
                className={`feed-tab ${sortBy === 'hot' ? 'active' : ''}`}
                onClick={() => setSortBy('hot')}
              >
                🔥 Hot
              </button>
              <button
                className={`feed-tab ${sortBy === 'top' ? 'active' : ''}`}
                onClick={() => setSortBy('top')}
              >
                ⭐ Top
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="create-post-card">
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                No posts yet. Be the first to post! 🚀
              </p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={user}
                onUpdate={fetchPosts}
              />
            ))
          )}
        </main>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
}

export default Home;
