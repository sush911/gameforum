import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiTrash2, FiHome, FiGrid, FiEdit3, FiTrendingUp, FiUsers, FiX, FiCheck, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Gaming-related emoji categories
const EMOJI_CATEGORIES = {
  'Gaming': ['🎮', '🕹️', '👾', '🎯', '🏆', '⚔️', '🛡️', '🗡️', '🔫', '💣', '🎲', '♟️', '🃏', '🀄'],
  'Tech': ['💻', '🖥️', '📱', '⌨️', '🖱️', '🎧', '🎤', '📺', '📡', '💾', '💿', '🔌'],
  'Sports': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥊', '🏎️'],
  'Fun': ['🔥', '⭐', '💎', '👑', '🎪', '🎨', '🎭', '🎬', '🎵', '🎸', '🎹', '🎺'],
  'Animals': ['🐉', '🦁', '🐺', '🦅', '🦊', '🐯', '🦈', '🐍', '🦂', '🕷️', '🦇', '🐲'],
  'Symbols': ['💀', '👻', '🤖', '👽', '🎃', '💫', '✨', '🌟', '💥', '⚡', '🌈', '☠️']
};

function CommunityManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Gaming');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '🎮',
    color: '#0079D3'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load communities');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:3000/api/categories',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCreateModal(false);
      setFormData({ name: '', slug: '', description: '', icon: '🎮', color: '#0079D3' });
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create community');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}" community? All posts in this community will remain but won't be categorized.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/categories/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to delete community');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
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

      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 backdrop-blur-xl shadow-lg"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.span 
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎮
              </motion.span>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Community Management
              </span>
            </Link>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/" 
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
              >
                <FiHome className="w-4 h-4" />
                <span>Back to Home</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
              Manage Communities
            </h1>
            <p className="text-white/90 text-lg drop-shadow">
              Create, edit, and delete gaming communities
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-white shadow-xl"
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
            <span>Create Community</span>
          </motion.button>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mb-6 p-4 rounded-xl text-white shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{error}</span>
                <button onClick={() => setError('')} className="hover:scale-110 transition-transform">
                  <FiX size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Communities Grid */}
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
              Loading communities...
            </motion.p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {categories.map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {/* Cover Image or Gradient */}
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative overflow-hidden"
                    style={{ 
                      width: '100%', 
                      height: '140px', 
                      background: category.coverImage 
                        ? `url(http://localhost:3000${category.coverImage}) center/cover`
                        : `linear-gradient(135deg, ${category.color || '#667eea'} 0%, ${category.color || '#764ba2'} 100%)`,
                    }}
                  >
                    {/* Overlay Stats */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="px-3 py-1.5 rounded-lg backdrop-blur-md shadow-lg flex items-center gap-2"
                        style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                      >
                        <FiTrendingUp size={14} className="text-purple-600" />
                        <span className="text-xs font-bold text-gray-800">{category.postCount || 0}</span>
                      </motion.div>
                    </div>
                    
                    {/* Delete Button */}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(category._id, category.name)}
                      className="absolute top-3 left-3 p-2 rounded-lg backdrop-blur-md shadow-lg transition-colors"
                      style={{ background: 'rgba(255, 255, 255, 0.95)' }}
                      title="Delete community"
                    >
                      <FiTrash2 className="w-5 h-5 text-red-600" />
                    </motion.button>
                  </motion.div>
                  
                  <div className="p-6">
                    {/* Icon & Name */}
                    <div className="flex items-start gap-4 mb-4">
                      {category.icon ? (
                        <motion.div
                          whileHover={{ rotate: 360, scale: 1.2 }}
                          transition={{ duration: 0.5 }}
                          className="text-5xl"
                        >
                          {category.icon}
                        </motion.div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-14 h-14 rounded-xl shadow-lg flex items-center justify-center text-white font-bold text-xl"
                          style={{
                            background: `linear-gradient(135deg, ${category.color || '#667eea'} 0%, ${category.color || '#764ba2'} 100%)`
                          }}
                        >
                          {category.name[0]?.toUpperCase()}
                        </motion.div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{category.name}</h3>
                        <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          /{category.slug}
                        </p>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {category.description || 'No description available'}
                    </p>
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <FiUsers className="text-gray-400" size={16} />
                        <span className="text-sm text-gray-600 font-semibold">
                          {category.postCount || 0} posts
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 180 }}
                          className="w-8 h-8 rounded-full shadow-md"
                          style={{ backgroundColor: category.color || '#667eea' }}
                          title="Community color"
                        />
                        {(category.postCount || 0) > 10 && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <FiZap className="text-yellow-500" size={18} />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {categories.length === 0 && !loading && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20 rounded-2xl backdrop-blur-xl shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <motion.span 
              className="text-7xl mb-4 block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🎮
            </motion.span>
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              No communities yet
            </h3>
            <p className="text-gray-600 mb-6 text-lg">Create your first gaming community!</p>
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
              <FiPlus className="w-5 h-5" />
              Create Community
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
            onClick={() => setShowEmojiPicker(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()} 
              style={{ 
                background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                border: '1px solid rgba(255, 255, 255, 0.5)'
              }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Create New Community
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">Set up a new gaming community</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEmojiPicker(false);
                      setFormData({ name: '', slug: '', description: '', icon: '🎮', color: '#0079D3' });
                      setError('');
                    }}
                    className="p-2 hover:bg-white rounded-lg transition-all"
                  >
                    <FiX size={24} className="text-gray-600" />
                  </motion.button>
                </div>
              </div>
              
              <form onSubmit={handleCreate} className="p-6 space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <FiEdit3 size={16} className="text-purple-600" />
                    Community Name *
                  </label>
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Esports, PC Gaming, Console Gaming"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-purple-500 focus:outline-none transition-all shadow-sm"
                    style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    URL Slug (auto-generated)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="esports"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 transition-all shadow-sm"
                    style={{ background: '#f3f4f6', borderColor: '#e5e7eb', color: '#6b7280' }}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="font-mono bg-purple-50 px-2 py-1 rounded">
                      /category/{formData.slug || 'slug'}
                    </span>
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Description
                  </label>
                  <motion.textarea
                    whileFocus={{ scale: 1.01 }}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe this community..."
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border-2 focus:border-purple-500 focus:outline-none transition-all resize-none shadow-sm"
                    style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
                  />
                </div>

                {/* Icon with Emoji Picker */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Icon Emoji (Optional)
                  </label>
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      {/* Selected Emoji Display */}
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-16 h-16 rounded-xl flex items-center justify-center text-4xl cursor-pointer shadow-lg transition-all"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Click to select emoji"
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: '3px solid white'
                        }}
                      >
                        {formData.icon || '🎮'}
                      </motion.div>
                      
                      {/* Text Input */}
                      <input
                        type="text"
                        name="icon"
                        value={formData.icon}
                        onChange={handleChange}
                        placeholder="🎮"
                        maxLength="2"
                        className="flex-1 px-4 py-3 rounded-xl border-2 focus:border-purple-500 focus:outline-none transition-all shadow-sm"
                        style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
                      />
                      
                      {/* Picker Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="px-5 py-3 text-white rounded-xl shadow-lg transition-all flex items-center gap-2 font-semibold"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      >
                        <FiGrid size={18} />
                        <span>Pick</span>
                      </motion.button>
                    </div>
                    
                    {/* Emoji Picker Dropdown */}
                    <AnimatePresence>
                      {showEmojiPicker && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-purple-200 z-50 p-4"
                        >
                          {/* Category Tabs */}
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                            {Object.keys(EMOJI_CATEGORIES).map(category => (
                              <motion.button
                                key={category}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => setSelectedEmojiCategory(category)}
                                className="px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all shadow-sm"
                                style={{
                                  background: selectedEmojiCategory === category
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : '#f3f4f6',
                                  color: selectedEmojiCategory === category ? 'white' : '#374151'
                                }}
                              >
                                {category}
                              </motion.button>
                            ))}
                          </div>
                          
                          {/* Emoji Grid */}
                          <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                            {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, index) => (
                              <motion.button
                                key={index}
                                whileHover={{ scale: 1.2, rotate: 10 }}
                                whileTap={{ scale: 0.9 }}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, icon: emoji });
                                  setShowEmojiPicker(false);
                                }}
                                className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-purple-50 rounded-lg transition-all"
                                title={emoji}
                              >
                                {emoji}
                              </motion.button>
                            ))}
                          </div>
                          
                          {/* Close Button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => setShowEmojiPicker(false)}
                            className="mt-3 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-semibold"
                          >
                            Close
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Theme Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <motion.input
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      className="w-16 h-12 rounded-xl border-2 cursor-pointer shadow-md"
                      style={{ borderColor: '#e5e7eb' }}
                    />
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleChange}
                      placeholder="#0079D3"
                      className="flex-1 px-4 py-3 rounded-xl border-2 focus:border-purple-500 focus:outline-none transition-all shadow-sm font-mono"
                      style={{ background: '#ffffff', borderColor: '#e5e7eb' }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center space-x-3 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    <FiCheck size={20} />
                    Create Community
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEmojiPicker(false);
                      setFormData({ name: '', slug: '', description: '', icon: '🎮', color: '#0079D3' });
                      setError('');
                    }}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                    style={{ background: '#f3f4f6', color: '#374151' }}
                  >
                    <FiX size={20} />
                    Cancel
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CommunityManagement;

