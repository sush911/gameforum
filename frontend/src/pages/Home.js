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
  const [userLoading, setUserLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
    fetchPosts();
    fetchUser();
  }, [selectedCategory, sortBy, searchQuery]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching user... Token exists:', !!token);
      if (token) {
        console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
      }
      
      if (!token) {
        console.log('No token found in localStorage');
        setUserLoading(false);
        return;
      }
      
      console.log('Calling /api/users/profile...');
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('User fetched successfully:', response.data.user.email);
      setUser(response.data.user || response.data);
      setUserLoading(false);
    } catch (err) {
      console.error('Failed to fetch user:', err.response?.status, err.response?.data);
      if (err.response?.status === 401) {
        console.log('401 error - removing token and redirecting to login');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      }
      setUserLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
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
      
      if (searchQuery.trim()) {
        fetchedPosts = fetchedPosts.filter(post => 
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (sortBy === 'hot') {
        fetchedPosts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      } else if (sortBy === 'top') {
        fetchedPosts.sort((a, b) => b.upvotes - a.upvotes);
      }
      
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPosts([]);
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
    setUser(null);
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <>
      {/* SINGLE HEADER */}
      <header className="modern-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <span className="logo-icon">🎮</span>
            <span>GameForum</span>
          </Link>
          
          <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search posts, categories, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                borderRadius: '20px',
                border: '2px solid #e0e0e0',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0079D3'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="#999"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}
            >
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
          </div>
          
          <nav className="header-nav">
            {userLoading ? (
              <div style={{ padding: '8px' }}>Loading...</div>
            ) : user ? (
              <>
                {(user.role === 'Admin' || user.role === 'Moderator') && (
                  <Link to="/admin" className="btn">
                    ⚙️ Admin
                  </Link>
                )}
                <Link to="/donate" className="btn">
                  💝 Donate
                </Link>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                  + Create
                </button>
                
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="user-menu"
                  >
                    <div className="user-avatar-small">
                      {user.avatar ? (
                        <img src={`http://localhost:3000${user.avatar}`} alt={user.username} />
                      ) : (
                        user.username?.[0]?.toUpperCase()
                      )}
                    </div>
                    <span>{user.username}</span>
                    <span>▼</span>
                  </button>
                  
                  {dropdownOpen && (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        background: 'white',
                        border: '1px solid var(--reddit-border)',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        minWidth: '200px',
                        zIndex: 1001
                      }}>
                        <Link 
                          to="/profile" 
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            color: 'var(--reddit-text)',
                            textDecoration: 'none',
                            borderBottom: '1px solid var(--reddit-border)'
                          }}
                        >
                          👤 Profile
                        </Link>
                        <Link 
                          to="/settings" 
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: 'block',
                            padding: '12px 16px',
                            color: 'var(--reddit-text)',
                            textDecoration: 'none',
                            borderBottom: '1px solid var(--reddit-border)'
                          }}
                        >
                          ⚙️ Settings
                        </Link>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            handleLogout();
                          }}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            color: '#E74C3C',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          🚪 Logout
                        </button>
                      </div>
                      <div 
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 1000
                        }}
                      />
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn">Login</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* MAIN LAYOUT - FEED LEFT, SIDEBAR RIGHT */}
      <div className="main-layout">
        {/* FEED - LEFT SIDE */}
        <main className="feed-container">
          <div className="feed-header">
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
            <div style={{ background: 'white', padding: '40px', textAlign: 'center', borderRadius: '4px', border: '1px solid var(--reddit-border)' }}>
              <p>No posts yet. Be the first to post! 🚀</p>
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

        {/* SIDEBAR - RIGHT SIDE */}
        <aside className="categories-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-title">Gaming Communities</div>
            
            <div
              className={`category-item ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              <div className="category-icon">🏠</div>
              <div className="category-name">All Posts</div>
            </div>
            
            {categories.map(cat => (
              <div
                key={cat._id}
                className={`category-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <div className="category-icon">
                  {cat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="category-name">{cat.name}</div>
                  <div className="category-count">{cat.postCount || 0} posts</div>
                </div>
              </div>
            ))}
          </div>

          {user && (
            <div className="sidebar-section">
              <div className="sidebar-title">Your Profile</div>
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <div className="user-avatar-small" style={{ width: '64px', height: '64px', margin: '0 auto 12px', fontSize: '24px' }}>
                  {user.avatar ? (
                    <img src={`http://localhost:3000${user.avatar}`} alt={user.username} />
                  ) : (
                    user.username?.[0]?.toUpperCase()
                  )}
                </div>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{user.username}</div>
                <div style={{ fontSize: '12px', color: 'var(--reddit-gray)' }}>{user.email}</div>
                {user.role !== 'User' && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '4px 8px', 
                    background: user.role === 'Admin' ? '#E74C3C' : '#F39C12',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'inline-block'
                  }}>
                    {user.role}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <CreatePostModal
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </>
  );
}

export default Home;
