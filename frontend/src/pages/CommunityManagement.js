import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiTrash2, FiHome, FiGrid } from 'react-icons/fi';

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
      
      // Create the community with form data (backend will set default images)
      const response = await axios.post(
        'http://localhost:3000/api/categories',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowCreateModal(false);
      setFormData({ name: '', slug: '', description: '', icon: '', color: '#0079D3' });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-3">
              <span className="text-3xl">🎮</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                Community Management
              </span>
            </Link>
            <Link to="/" className="btn-secondary flex items-center space-x-2">
              <FiHome className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Communities</h1>
            <p className="text-gray-600">Create, edit, and delete gaming communities</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Community</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* Communities Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div
                key={category._id}
                className="card overflow-hidden hover:shadow-2xl transition-all duration-300"
              >
                {/* Cover Image or Default Gradient */}
                <div style={{ 
                  width: '100%', 
                  height: '120px', 
                  background: category.coverImage 
                    ? `url(http://localhost:3000${category.coverImage}) center/cover`
                    : `linear-gradient(135deg, ${category.color || '#0079D3'} 0%, ${category.color || '#0056A3'} 100%)`,
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '16px'
                }} />
                
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      {/* Avatar - Icon or Color Circle */}
                      {category.icon ? (
                        <span className="text-5xl">{category.icon}</span>
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: category.color || '#0079D3',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          fontWeight: 700,
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {category.name[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">/{category.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete community"
                    >
                      <FiTrash2 className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <p className="text-gray-600 mb-6 line-clamp-2 text-base">
                    {category.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <span className="text-base text-gray-500 font-medium">
                      {category.postCount || 0} posts
                    </span>
                    <div
                      className="w-10 h-10 rounded-full"
                      style={{ backgroundColor: category.color || '#0079D3' }}
                      title="Community color"
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {categories.length === 0 && !loading && (
          <div className="text-center py-20">
            <span className="text-6xl mb-4 block">🎮</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No communities yet</h3>
            <p className="text-gray-600 mb-6">Create your first gaming community!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <FiPlus className="inline mr-2" />
              Create Community
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEmojiPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: '#F8FBFD' }}>
            <div className="p-6 border-b" style={{ borderColor: '#D6E4F0' }}>
              <h2 className="text-2xl font-bold text-gray-900">Create New Community</h2>
              <p className="text-sm text-gray-600 mt-1">Set up a new gaming community</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Community Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Esports, PC Gaming, Console Gaming"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 focus:border-blue-500 focus:outline-none transition-all"
                  style={{ background: '#F8FBFD', borderColor: '#D6E4F0' }}
                />
              </div>

              {/* Slug (auto-generated) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL Slug (auto-generated)
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="esports"
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 focus:border-blue-500 focus:outline-none transition-all"
                  style={{ background: '#EBF5FB', borderColor: '#D6E4F0' }}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL: /category/{formData.slug || 'slug'}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe this community..."
                  rows="3"
                  className="w-full px-4 py-3 rounded-lg border-2 focus:border-blue-500 focus:outline-none transition-all resize-none"
                  style={{ background: '#F8FBFD', borderColor: '#D6E4F0' }}
                />
              </div>

              {/* Icon with Emoji Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon Emoji (Optional)
                </label>
                <div className="relative">
                  <div className="flex items-center gap-3">
                    {/* Selected Emoji Display */}
                    <div 
                      className="w-16 h-16 rounded-xl border-2 border-blue-200 bg-blue-50 flex items-center justify-center text-3xl cursor-pointer hover:border-blue-400 transition-all"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      title="Click to select emoji"
                    >
                      {formData.icon || '🎮'}
                    </div>
                    
                    {/* Text Input */}
                    <input
                      type="text"
                      name="icon"
                      value={formData.icon}
                      onChange={handleChange}
                      placeholder="🎮"
                      maxLength="2"
                      className="input-field flex-1"
                      style={{ background: '#F8FBFD', border: '1px solid #D6E4F0' }}
                    />
                    
                    {/* Picker Button */}
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
                    >
                      <FiGrid size={18} />
                      <span>Pick</span>
                    </button>
                  </div>
                  
                  {/* Emoji Picker Dropdown */}
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-blue-200 z-50 p-4">
                      {/* Category Tabs */}
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                        {Object.keys(EMOJI_CATEGORIES).map(category => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setSelectedEmojiCategory(category)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                              selectedEmojiCategory === category
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                      
                      {/* Emoji Grid */}
                      <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
                        {EMOJI_CATEGORIES[selectedEmojiCategory].map((emoji, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, icon: emoji });
                              setShowEmojiPicker(false);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      
                      {/* Close Button */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="mt-3 w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all text-sm font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Theme Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                    style={{ borderColor: '#D6E4F0' }}
                  />
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="#0079D3"
                    className="flex-1 px-4 py-3 rounded-lg border-2 focus:border-blue-500 focus:outline-none transition-all"
                    style={{ background: '#F8FBFD', borderColor: '#D6E4F0' }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center space-x-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all shadow-lg hover:shadow-xl"
                  style={{ background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)' }}
                >
                  Create Community
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEmojiPicker(false);
                    setFormData({ name: '', slug: '', description: '', icon: '🎮', color: '#0079D3' });
                    setError('');
                  }}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all"
                  style={{ background: '#EBF5FB', color: '#1c1c1c' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityManagement;
