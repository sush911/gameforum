import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiPlus, FiTrendingUp, FiClock, FiStar, FiSettings, FiShield, FiHome,
  FiUsers, FiActivity, FiZap, FiArrowUp
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';

function NewHome() {
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('new');
  const [communitySortBy, setCommunitySortBy] = useState('popular');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const navigate = useNavigate();

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      
      if (sortBy === 'top') {
        fetchedPosts.sort((a, b) => b.upvotes - a.upvotes);
      } else {
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
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.05, 0.03]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.05, 0.03, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }}
        />
      </div>

      {/* Navbar */}
      <Navbar user={user} handleLogout={handleLogout} />

      {/* Action Buttons for Logged-in Users */}
      <AnimatePresence>
        {!userLoading && user && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"
          >
            <div className="flex items-center justify-end gap-3 mb-4">
              {(user.role === 'Admin' || user.role === 'Moderator') && (
                <>
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      to="/admin" 
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        boxShadow: '0 4px 15px rgba(240, 147, 251, 0.4)'
                      }}
                    >
                      <FiShield className="w-4 h-4" />
                      <span>Admin</span>
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                    <Link 
                      to="/communities" 
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
                      }}
                    >
                      <FiSettings className="w-4 h-4" />
                      <span>Communities</span>
                    </Link>
                  </motion.div>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white shadow-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  boxShadow: '0 8px 20px rgba(250, 112, 154, 0.5)'
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 90, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FiPlus className="w-5 h-5" />
                </motion.div>
                <span>Create Post</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Communities */}
          <motion.aside
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100 }}
            className="lg:col-span-1"
          >
            <div 
              className="sticky top-24 rounded-2xl p-5 backdrop-blur-xl shadow-2xl"
              style={{ 
                maxHeight: 'calc(100vh - 120px)', 
                overflowY: 'auto',
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <FiUsers className="w-6 h-6 text-purple-600" />
                </motion.div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  COMMUNITIES
                </h2>
              </div>
              
              {/* Community Sort Filters */}
              <div className="flex gap-2 mb-4">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCommunitySortBy('popular')}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
                  style={{
                    background: communitySortBy === 'popular' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: communitySortBy === 'popular' ? 'white' : '#1c1c1c',
                    boxShadow: communitySortBy === 'popular' 
                      ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiTrendingUp size={14} />
                    Popular
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCommunitySortBy('new')}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md"
                  style={{
                    background: communitySortBy === 'new'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    color: communitySortBy === 'new' ? 'white' : '#1c1c1c',
                    boxShadow: communitySortBy === 'new'
                      ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiClock size={14} />
                    New
                  </div>
                </motion.button>
              </div>
              
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(null)}
                  className="w-full p-3 rounded-xl transition-all flex items-center gap-3 shadow-sm"
                  style={{
                    background: !selectedCategory 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'white',
                    color: !selectedCategory ? 'white' : '#1c1c1c',
                    border: !selectedCategory ? 'none' : '2px solid #e5e7eb'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center shadow-md"
                    style={{ 
                      background: !selectedCategory 
                        ? 'rgba(255, 255, 255, 0.2)' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}
                  >
                    <FiHome size={18} style={{ color: 'white' }} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bold text-sm">All Posts</div>
                    <div className="text-xs opacity-75">{posts.length} posts</div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <FiActivity size={16} className="opacity-50" />
                  </motion.div>
                </motion.button>

                {[...categories]
                  .sort((a, b) => {
                    if (communitySortBy === 'popular') {
                      return (b.postCount || 0) - (a.postCount || 0);
                    } else {
                      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                    }
                  })
                  .map((cat, index) => (
                    <motion.div
                      key={cat._id}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to={`/community/${cat.slug}`}
                        className="block p-3 rounded-xl transition-all flex items-center gap-3 shadow-sm"
                        style={{
                          background: selectedCategory?._id === cat._id
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'white',
                          color: selectedCategory?._id === cat._id ? 'white' : '#1c1c1c',
                          border: selectedCategory?._id === cat._id ? 'none' : '2px solid #e5e7eb',
                          textDecoration: 'none'
                        }}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shadow-md"
                          style={{
                            background: selectedCategory?._id === cat._id
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                          }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-bold text-sm">{cat.name}</div>
                          <div className="text-xs opacity-75">{cat.postCount || 0} posts</div>
                        </div>
                        {(cat.postCount || 0) > 10 && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <FiZap size={14} className="text-yellow-400" />
                          </motion.div>
                        )}
                      </Link>
                    </motion.div>
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
              className="rounded-2xl p-5 mb-6 backdrop-blur-xl shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="flex items-center space-x-3">
                {[
                  { id: 'new', icon: FiClock, label: 'New', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                  { id: 'top', icon: FiStar, label: 'Top (Most Liked)', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSortBy(tab.id)}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                    style={{
                      background: sortBy === tab.id ? tab.gradient : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      color: sortBy === tab.id ? 'white' : '#374151',
                      boxShadow: sortBy === tab.id ? '0 6px 20px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <motion.div
                      animate={sortBy === tab.id ? { rotate: [0, 360] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <tab.icon className="w-5 h-5" />
                    </motion.div>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Posts */}
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 rounded-2xl backdrop-blur-xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 rounded-full"
                  style={{
                    border: '4px solid transparent',
                    borderTop: '4px solid #667eea',
                    borderRight: '4px solid #764ba2'
                  }}
                />
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="mt-4 text-gray-700 font-semibold text-lg"
                >
                  Loading amazing posts...
                </motion.p>
              </motion.div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="rounded-2xl p-12 text-center backdrop-blur-xl shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  📭
                </motion.div>
                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  No posts yet
                </h3>
                <p className="text-gray-600 mb-6 text-lg">Be the first to share something amazing!</p>
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-3 rounded-xl font-bold text-white shadow-xl"
                    style={{
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      boxShadow: '0 8px 20px rgba(250, 112, 154, 0.5)'
                    }}
                  >
                    <FiPlus className="inline mr-2" />
                    Create Post
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ y: -4 }}
                    >
                      <PostCard
                        post={post}
                        currentUser={user}
                        onUpdate={fetchPosts}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-4 rounded-full text-white shadow-2xl z-50"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)'
            }}
          >
            <FiArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

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

