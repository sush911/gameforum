import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiHome, FiDollarSign, FiUsers, FiUser, FiSettings, 
  FiShield, FiLogOut, FiSearch, FiChevronDown 
} from 'react-icons/fi';
import { SiGamejolt } from 'react-icons/si';
import '../styles/Navbar.css';

function Navbar({ user, handleLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // all, posts, communities, users
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Call backend logout endpoint
        await axios.post('http://localhost:3000/api/users/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.error('Logout API error:', err));
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Always clear local storage and redirect
      handleLogout();
      navigate('/login');
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Search based on filter
      let results = { posts: [], communities: [], users: [] };
      
      if (searchFilter === 'all' || searchFilter === 'posts') {
        try {
          const postsRes = await axios.get(`http://localhost:3000/api/posts?search=${query}`, { headers });
          results.posts = postsRes.data.slice(0, 5);
        } catch (err) {
          console.error('Posts search error:', err);
        }
      }
      
      if (searchFilter === 'all' || searchFilter === 'communities') {
        try {
          const categoriesRes = await axios.get('http://localhost:3000/api/categories');
          results.communities = categoriesRes.data.filter(cat => 
            cat.name.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 5);
        } catch (err) {
          console.error('Communities search error:', err);
        }
      }
      
      if (searchFilter === 'all' || searchFilter === 'users') {
        try {
          const usersRes = await axios.get(`http://localhost:3000/api/users/search?q=${query}`);
          results.users = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || []);
        } catch (err) {
          console.error('Users search error:', err);
        }
      }
      
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchFilter]);

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <SiGamejolt size={24} style={{ color: '#0079D3' }} />
          <span>GameForum</span>
        </Link>

        {/* Search Bar */}
        <div style={{ flex: 1, maxWidth: '600px', margin: '0 20px', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search GameForum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 16px',
                border: '1px solid #ccc',
                borderRadius: '20px',
                fontSize: '14px',
                outline: 'none',
                background: '#f6f7f8'
              }}
            />
            <FiSearch style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#878A8C',
              fontSize: '18px'
            }} />
          </div>

          {/* Search Filters */}
          {searchQuery && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 1000,
              display: showSearchResults ? 'block' : 'none'
            }}>
              {/* Filter Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                padding: '12px',
                borderBottom: '1px solid #edeff1'
              }}>
                {['all', 'posts', 'communities', 'users'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSearchFilter(filter)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '16px',
                      background: searchFilter === filter ? '#0079D3' : '#f6f7f8',
                      color: searchFilter === filter ? 'white' : '#1c1c1c',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Search Results */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {searchLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#878A8C' }}>
                    Searching...
                  </div>
                ) : (
                  <>
                    {/* Posts Results */}
                    {(searchFilter === 'all' || searchFilter === 'posts') && searchResults.posts?.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#878A8C', background: '#f6f7f8' }}>
                          POSTS
                        </div>
                        {searchResults.posts.map(post => (
                          <Link
                            key={post._id}
                            to={`/post/${post._id}`}
                            onClick={() => setShowSearchResults(false)}
                            style={{
                              display: 'block',
                              padding: '12px 16px',
                              borderBottom: '1px solid #edeff1',
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f6f7f8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{post.title}</div>
                            <div style={{ fontSize: '12px', color: '#878A8C' }}>
                              by {post.user?.username || 'Unknown'} • {post.upvotes || 0} likes
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Communities Results */}
                    {(searchFilter === 'all' || searchFilter === 'communities') && searchResults.communities?.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#878A8C', background: '#f6f7f8' }}>
                          COMMUNITIES
                        </div>
                        {searchResults.communities.map(community => (
                          <Link
                            key={community._id}
                            to={`/community/${community.slug}`}
                            onClick={() => setShowSearchResults(false)}
                            style={{
                              display: 'block',
                              padding: '12px 16px',
                              borderBottom: '1px solid #edeff1',
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f6f7f8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '20px' }}>{community.icon}</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>{community.name}</div>
                                <div style={{ fontSize: '12px', color: '#878A8C' }}>
                                  {community.postCount || 0} posts
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Users Results */}
                    {(searchFilter === 'all' || searchFilter === 'users') && searchResults.users?.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, color: '#878A8C', background: '#f6f7f8' }}>
                          USERS
                        </div>
                        {searchResults.users.map(user => (
                          <Link
                            key={user._id}
                            to={`/user/${user.username}`}
                            onClick={() => setShowSearchResults(false)}
                            style={{
                              display: 'block',
                              padding: '12px 16px',
                              borderBottom: '1px solid #edeff1',
                              textDecoration: 'none',
                              color: 'inherit'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f6f7f8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {user.avatar ? (
                                <img 
                                  src={`http://localhost:3000${user.avatar}`} 
                                  alt={user.username}
                                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#0079D3',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 600
                                }}>
                                  {user.username[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 600 }}>{user.username}</div>
                                {user.bio && (
                                  <div style={{ fontSize: '12px', color: '#878A8C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                    {user.bio}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* No Results */}
                    {!searchLoading && 
                     searchResults.posts?.length === 0 && 
                     searchResults.communities?.length === 0 && 
                     searchResults.users?.length === 0 && (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#878A8C' }}>
                        No results found for "{searchQuery}"
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Menu */}
        <ul className="navbar-menu">
          <li>
            <Link to="/" className="navbar-link">
              <FiHome size={18} />
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link to="/donate" className="navbar-link">
              <FiDollarSign size={18} />
              <span>Donate</span>
            </Link>
          </li>
          {user?.role === 'Admin' && (
            <li>
              <Link to="/community" className="navbar-link">
                <FiUsers size={18} />
                <span>Community</span>
              </Link>
            </li>
          )}
        </ul>

        {/* Right Side - User Menu */}
        <div className="navbar-right">
          {user ? (
            <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="user-dropdown">
                <button 
                  className="navbar-user-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="user-avatar">
                    {user.avatar ? (
                      <img src={`http://localhost:3000${user.avatar}`} alt={user.username} />
                    ) : (
                      user.username?.[0]?.toUpperCase() || '👤'
                    )}
                  </span>
                  <span className="user-name">{user.username || 'User'}</span>
                  <FiChevronDown size={16} className="dropdown-arrow" />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="dropdown-menu">
                      <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <FiUser size={16} />
                        <span>My Profile</span>
                      </Link>
                      <Link to="/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <FiSettings size={16} />
                        <span>Settings</span>
                      </Link>
                      {user.role === 'Admin' && (
                        <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <FiShield size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <hr className="dropdown-divider" />
                      <button onClick={onLogout} className="dropdown-item logout-btn">
                        <FiLogOut size={16} />
                        <span>Logout</span>
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
                        zIndex: 999
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
