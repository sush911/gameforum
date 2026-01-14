import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPlus, FiTrendingUp, FiClock, FiStar, FiSettings, FiShield, FiHome
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';

function NewHome() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('new');
  const [communitySortBy, setCommunitySortBy] = useState('popular'); // popular or new
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUserLoading(false);
        return;
      }
      
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user || response.data);
      setUserLoading(false);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      }
      setUserLoading(false);
    }
  }, [navigate]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      let url = 'http://localhost:3000/api/posts';
      
      if (selectedCategory) {
        url = `http://localhost:3000/api/posts/category/${selectedCategory.slug}`;
      }
      
      const response = await axios.get(url);
      let fetchedPosts = response.data;
      
      // Sort by top (most likes) or new (default)
      if (sortBy === 'top') {
        fetchedPosts.sort((a, b) => b.upvotes - a.upvotes);
      } else {
        // Default: sort by newest first
        fetchedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      setPosts(fetchedPosts);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    fetchCategories();
    fetchPosts();
    fetchUser();
  }, [fetchCategories, fetchPosts, fetchUser]);

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #E8F0F7 0%, #F0F4F8 100%)' }}>
      {/* Navbar */}
      <Navbar user={user} handleLogout={handleLogout} />

      {/* Action Buttons for Logged-in Users */}
      {!userLoading && user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center justify-end gap-3 mb-4">
            {(user.role === 'Admin' || user.role === 'Moderator') && (
              <>
                <Link to="/admin" className="btn-secondary flex items-center space-x-2">
                  <FiShield className="w-4 h-4" />
                  <span>Admin</span>
                </Link>
                <Link to="/communities" className="btn-secondary flex items-center space-x-2">
                  <FiSettings className="w-4 h-4" />
                  <span>Communities</span>
                </Link>
              </>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Create Post</span>
            </motion.button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Communities */}
          <motion.aside
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="lg:col-span-1"
          >
            <div className="sidebar-section sticky top-24" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
              <div className="sidebar-title">COMMUNITIES</div>
              
              {/* Community Sort Filters */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => setCommunitySortBy('popular')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: communitySortBy === 'popular' ? '#0079D3' : '#f6f7f8',
                    color: communitySortBy === 'popular' ? 'white' : '#1c1c1c',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FiTrendingUp size={14} />
                  Popular
                </button>
                <button
                  onClick={() => setCommunitySortBy('new')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: communitySortBy === 'new' ? '#0079D3' : '#f6f7f8',
                    color: communitySortBy === 'new' ? 'white' : '#1c1c1c',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <FiClock size={14} />
                  New
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`category-item ${!selectedCategory ? 'active' : ''}`}
                  style={{ marginBottom: '0' }}
                >
                  <div className="category-icon" style={{ background: '#0079D3' }}>
                    <FiHome size={18} style={{ color: 'white' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="category-name">All Posts</div>
                    <div className="category-count">{posts.length} posts</div>
                  </div>
                </button>

                {[...categories]
                  .sort((a, b) => {
                    if (communitySortBy === 'popular') {
                      return (b.postCount || 0) - (a.postCount || 0);
                    } else {
                      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    }
                  })
                  .map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/community/${cat.slug}`}
                      className={`category-item ${selectedCategory?._id === cat._id ? 'active' : ''}`}
                      style={{ marginBottom: '0', textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="category-icon">{cat.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div className="category-name">{cat.name}</div>
                        <div className="category-count">{cat.postCount || 0} posts</div>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          </motion.aside>

          {/* Feed */}
          <main className="lg:col-span-3">
            {/* Sort Tabs */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="card p-4 mb-6"
            >
              <div className="flex items-center space-x-3">
                {[
                  { id: 'new', icon: FiClock, label: 'New' },
                  { id: 'top', icon: FiStar, label: 'Top (Most Liked)' },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSortBy(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 ${
                      sortBy === tab.id
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-blue-50'
                    }`}
                    style={{
                      backgroundColor: sortBy === tab.id ? undefined : '#EBF5FB'
                    }}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Posts */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full"
                />
                <p className="mt-4 text-gray-600 font-medium">Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card p-12 text-center"
              >
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Be the first to share something!</p>
                {user && (
                  <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                    <FiPlus className="inline mr-2" />
                    Create Post
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard
                      post={post}
                      currentUser={user}
                      onUpdate={fetchPosts}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
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

export default NewHome;
