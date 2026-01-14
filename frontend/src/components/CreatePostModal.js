import React, { useState } from 'react';
import axios from 'axios';

function CreatePostModal({ categories, onClose, onPostCreated, preselectedCategory = null, preselectedCommunityName = null, preselectedCommunityIcon = null }) {
  const [postType, setPostType] = useState('text');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: preselectedCategory || ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(7); // days
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Debug preselected category
  React.useEffect(() => {
    if (preselectedCategory) {
      // Preselected category detected
    }
  }, [preselectedCategory, categories, preselectedCommunityName, preselectedCommunityIcon]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    
    const oversized = files.filter(f => f.size > 20 * 1024 * 1024);
    if (oversized.length > 0) {
      setError('Each image must be less than 20MB');
      return;
    }
    
    setSelectedImages(files);
    setError('');
    
    // Auto-set post type to 'image' if not already blog
    if (postType === 'text' && files.length > 0) {
      setPostType('image');
    }
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 1024 * 1024 * 1024) {
      setError('Video must be less than 1GB');
      return;
    }
    setSelectedVideo(file);
    setError('');
    
    // Auto-set post type to 'video'
    if (file) {
      setPostType('video');
    }
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) return [];

    const formData = new FormData();
    selectedImages.forEach(file => {
      formData.append('postImages', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/upload/post-images',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.images;
    } catch (err) {
      throw new Error('Image upload failed');
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo) return null;

    const formData = new FormData();
    formData.append('postVideo', selectedVideo);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/upload/post-video',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.videoUrl;
    } catch (err) {
      throw new Error('Video upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setUploading(false);
        return;
      }

      if (!formData.title) {
        setError('Title is required');
        setUploading(false);
        return;
      }

      // Content is optional for video/image posts
      if (!formData.content && postType !== 'video' && postType !== 'image') {
        setError('Content is required for this post type');
        setUploading(false);
        return;
      }

      // Validate poll
      if (postType === 'poll') {
        const validOptions = pollOptions.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          setError('Poll must have at least 2 options');
          setUploading(false);
          return;
        }
      }

      let imageUrls = [];
      let videoUrl = null;

      if ((postType === 'image' || postType === 'blog') && selectedImages.length > 0) {
        imageUrls = await uploadImages();
      }

      if (postType === 'video' && selectedVideo) {
        videoUrl = await uploadVideo();
      }

      const postData = {
        ...formData,
        type: postType,
        images: imageUrls,
        videoUrl: videoUrl
      };

      // Add poll data
      if (postType === 'poll') {
        const validOptions = pollOptions.filter(opt => opt.trim()).map(text => ({
          text: text.trim(),
          votes: 0,
          votedBy: []
        }));
        postData.pollOptions = validOptions;
        postData.pollEndsAt = new Date(Date.now() + pollDuration * 24 * 60 * 60 * 1000);
      }

      const response = await axios.post(
        'http://localhost:3000/api/posts/create',
        postData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onPostCreated();
    } catch (err) {
      setError(err.response?.data?.msg || err.message || 'Post creation failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        <div className="modal-header" style={{ marginBottom: '24px' }}>
          <h2 className="modal-title">Create Post</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Post Type Selection */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ marginBottom: '12px', display: 'block' }}>Post Type</label>
            <div className="post-type-buttons" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`post-type-btn ${postType === 'text' ? 'active' : ''}`}
                onClick={() => setPostType('text')}
                title="Text Post"
              >
                📝 Text
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'blog' ? 'active' : ''}`}
                onClick={() => setPostType('blog')}
                title="Blog Post (Text + Images)"
              >
                📰 Blog
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'image' ? 'active' : ''}`}
                onClick={() => setPostType('image')}
                title="Image Post"
              >
                🖼️ Images
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'video' ? 'active' : ''}`}
                onClick={() => setPostType('video')}
                title="Video Post"
              >
                🎥 Video
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'poll' ? 'active' : ''}`}
                onClick={() => setPostType('poll')}
                title="Poll/Voting"
              >
                📊 Poll
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="category" style={{ marginBottom: '8px', display: 'block' }}>
              Community {preselectedCategory && <span style={{ color: '#0079D3', fontSize: '13px' }}>(Pre-selected)</span>}
            </label>
            {preselectedCategory ? (
              <>
                <div style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#f6f7f8',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  color: '#1c1c1c',
                  fontWeight: 600
                }}>
                  {preselectedCommunityIcon || '🎮'} {preselectedCommunityName || categories.find(cat => cat._id === preselectedCategory)?.name || 'Selected Community'}
                </div>
                <small style={{ color: '#878A8C', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Posting to this community. Go to home to post elsewhere.
                </small>
              </>
            ) : (
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={{ width: '100%' }}
              >
                <option value="">Select a community</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Title */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="title" style={{ marginBottom: '8px', display: 'block' }}>Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter an interesting title..."
              maxLength="200"
              required
              style={{ width: '100%' }}
            />
          </div>

          {/* Content */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label htmlFor="content" style={{ marginBottom: '8px', display: 'block' }}>
              Content {(postType === 'video' || postType === 'image') && <span style={{ color: '#878A8C', fontSize: '13px' }}>(Optional)</span>}
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="What's on your mind?"
              rows="6"
              maxLength="5000"
              style={{ width: '100%' }}
            />
            <small>{formData.content.length}/5000</small>
          </div>

          {/* Image Upload */}
          {(postType === 'image' || postType === 'blog') && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="images" style={{ marginBottom: '8px', display: 'block' }}>
                {postType === 'blog' ? 'Upload Images for Blog (Optional, Max 10)' : 'Upload Images (Max 10, 20MB each)'}
              </label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                style={{ width: '100%' }}
              />
              {selectedImages.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedImages.length} image(s) selected
                  {selectedImages.map((img, idx) => (
                    <div key={idx}>• {img.name} ({(img.size / 1024 / 1024).toFixed(2)} MB)</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Poll Options */}
          {postType === 'poll' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>Poll Options</label>
              {pollOptions.map((option, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handlePollOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    maxLength="100"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removePollOption(index)}
                      style={{
                        padding: '8px 12px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button
                  type="button"
                  onClick={addPollOption}
                  style={{
                    padding: '8px 16px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  + Add Option
                </button>
              )}
              
              <div style={{ marginTop: '16px' }}>
                <label htmlFor="pollDuration" style={{ marginBottom: '8px', display: 'block' }}>
                  Poll Duration
                </label>
                <select
                  id="pollDuration"
                  value={pollDuration}
                  onChange={(e) => setPollDuration(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value={1}>1 Day</option>
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
            </div>
          )}

          {/* Video Upload */}
          {postType === 'video' && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="video" style={{ marginBottom: '8px', display: 'block' }}>
                Upload Video (Max 1GB)
              </label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoSelect}
                style={{ width: '100%' }}
              />
              {selectedVideo && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedVideo.name} ({(selectedVideo.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={uploading}
              style={{ flex: 1, padding: '12px' }}
            >
              {uploading ? 'Posting...' : 'Post'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={uploading}
              style={{ padding: '12px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePostModal;
