import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiTrendingUp, FiClock, FiUsers, FiFileText, FiPlus, 
  FiCheck, FiArrowLeft, FiStar, FiZap, FiActivity 
} from 'react-icons/fi';
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
      
      const filteredPosts = response.data.filter(post => {
        if (post.category) {
          const categorySlug = typeof post.category === 'object' ? post.category.slug : post.category;
          return categorySlug === slug;
        }
        return false;
      });

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
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Navbar user={user} handleLogout={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }} />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full mb-4"
            style={{
              border: '4px solid transparent',
              borderTop: '4px solid white',
              borderRight: '4px solid rgba(255,255,255,0.5)'
            }}
          />
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white text-lg font-semibold drop-shadow-lg"
          >
            Loading community...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Navbar user={user} handleLogout={() => {
          localStorage.removeItem('token');
          window.dispatchEvent(new Event('authChange'));
          navigate('/login');
        }} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-7xl mb-6"
          >
            ❌
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">Community not found</h2>
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-xl font-bold text-white shadow-xl flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              boxShadow: '0 8px 20px rgba(250, 112, 154, 0.5)'
            }}
          >
            <FiArrowLeft size={20} />
            Go Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Animated Background */}
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
      </div>

      <Navbar user={user} handleLogout={() => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      }} />

      {/* Community Header with Cover */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-6 relative z-10"
      >
        {/* Cover Image or Gradient */}
        <motion.div
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            height: '240px',
            background: community.coverImage 
              ? `url(http://localhost:3000${community.coverImage}) center/cover`
              : `linear-gradient(135deg, ${community.color || '#667eea'} 0%, ${community.color || '#764ba2'} 100%)`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Overlay Pattern */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }} />
        </motion.div>
        
        {/* Community Info Card */}
        <div className="backdrop-blur-xl shadow-2xl relative"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            marginTop: '-80px',
            borderRadius: '24px 24px 0 0'
          }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-end gap-6 mb-4">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 360 }}
                style={{
                  width: '120px',
                  height: '120px',
                  background: community.icon ? 'white' : `linear-gradient(135deg, ${community.color || '#667eea'} 0%, ${community.color || '#764ba2'} 100%)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: community.icon ? '60px' : '48px',
                  fontWeight: 700,
                  color: community.icon ? 'inherit' : 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  border: '6px solid rgba(255, 255, 255, 0.95)',
                  cursor: 'pointer'
                }}
              >
                {community.icon || community.name[0]?.toUpperCase()}
              </motion.div>
              
              <div className="flex-1 pb-2">
                <motion.h1
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                >
                  {community.name}
                </motion.h1>
                <motion.p
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-lg"
                >
                  {community.description}
                </motion.p>
              </div>
              
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={joined ? handleLeaveCommunity : handleJoinCommunity}
                className="px-8 py-3 rounded-xl font-bold shadow-xl transition-all flex items-center gap-2 mb-2"
                style={{
                  background: joined 
                    ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'
                    : `linear-gradient(135deg, ${community.color || '#667eea'} 0%, ${community.color || '#764ba2'} 100%)`,
                  color: joined ? '#374151' : 'white',
                  boxShadow: joined ? '0 4px 15px rgba(0,0,0,0.1)' : '0 8px 20px rgba(102, 126, 234, 0.4)'
                }}
              >
                {joined ? (
                  <>
                    <FiCheck size={20} />
                    Joined
                  </>
                ) : (
                  <>
                    <FiPlus size={20} />
                    Join
                  </>
                )}
              </motion.button>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex gap-6 pl-36"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm" 
                style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}
              >
                <FiFileText className="text-purple-600" size={18} />
                <span className="font-semibold text-gray-700">{community.postCount || 0} posts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm"
                style={{ background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}
              >
                <FiUsers className="text-pink-600" size={18} />
                <span className="font-semibold text-gray-700">{community.members?.length || 0} members</span>
              </div>
              {(community.postCount || 0) > 10 && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' }}
                >
                  <FiZap className="text-yellow-600" size={18} />
                  <span className="font-semibold text-yellow-700">Popular</span>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Posts Feed */}
          <div className="lg:col-span-2">
            {/* Sort Options */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="rounded-2xl p-4 mb-6 backdrop-blur-xl shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="flex items-center gap-3">
                {[
                  { id: 'new', icon: FiClock, label: 'New', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
                  { id: 'top', icon: FiStar, label: 'Top', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }
                ].map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSortBy(tab.id)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
                    style={{
                      background: sortBy === tab.id ? tab.gradient : 'linear-gradient(135deg, #f5f7fa 0%, #e5e7eb 100%)',
                      color: sortBy === tab.id ? 'white' : '#374151',
                      boxShadow: sortBy === tab.id ? '0 6px 20px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <motion.div
                      animate={sortBy === tab.id ? { rotate: [0, 360] } : {}}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <tab.icon size={18} />
                    </motion.div>
                    <span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Posts */}
            {posts.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-2xl p-12 text-center backdrop-blur-xl shadow-2xl"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  📭
                </motion.div>
                <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  No posts yet
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Be the first to post in {community.name}!
                </p>
                {user && (
                  <motion.button
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="px-8 py-3 rounded-xl font-bold text-white shadow-xl inline-flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      boxShadow: '0 8px 20px rgba(250, 112, 154, 0.5)'
                    }}
                  >
                    <FiPlus size={20} />
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="sticky top-24 rounded-2xl p-6 backdrop-blur-xl shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <FiActivity className="text-purple-600" size={20} />
                </motion.div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  About Community
                </h3>
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed">
                {community.description}
              </p>
              
              <div className="rounded-xl p-4 mb-6"
                style={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #e5e7eb 100%)' }}
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-300">
                  <div className="flex items-center gap-2">
                    <FiFileText className="text-purple-600" size={16} />
                    <span className="text-sm text-gray-600 font-medium">Posts</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{community.postCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiUsers className="text-pink-600" size={16} />
                    <span className="text-sm text-gray-600 font-medium">Members</span>
                  </div>
                  <span className="text-lg font-bold text-gray-800">{community.members?.length || 0}</span>
                </div>
              </div>
              
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="w-full py-3 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    boxShadow: '0 8px 20px rgba(250, 112, 154, 0.5)'
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 90, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <FiPlus size={20} />
                  </motion.div>
                  Create Post
                </motion.button>
              )}
            </motion.div>
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
    </div>
  );
}

export default CommunityPage;
