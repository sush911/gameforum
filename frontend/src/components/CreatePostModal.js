import React, { useState } from 'react';
import axios from 'axios';

function CreatePostModal({ categories, onClose, onPostCreated }) {
  const [postType, setPostType] = useState('text');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    linkUrl: ''
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }
    setSelectedImages(files);
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 500 * 1024 * 1024) {
      setError('Video must be less than 500MB');
      return;
    }
    setSelectedVideo(file);
  };

  const handleFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError('Maximum 5 files allowed');
      return;
    }
    setSelectedFiles(files);
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

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('postFiles', file);
    });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/api/upload/post-files',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data.files;
    } catch (err) {
      throw new Error('File upload failed');
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

      if (!formData.title || !formData.content) {
        setError('Title and content are required');
        setUploading(false);
        return;
      }

      if (!formData.category) {
        setError('Please select a category');
        setUploading(false);
        return;
      }

      let imageUrls = [];
      let videoUrl = null;
      let files = [];

      if (postType === 'image' && selectedImages.length > 0) {
        imageUrls = await uploadImages();
      }

      if (postType === 'video' && selectedVideo) {
        videoUrl = await uploadVideo();
      }

      if (postType === 'file' && selectedFiles.length > 0) {
        files = await uploadFiles();
      }

      const response = await axios.post(
        'http://localhost:3000/api/posts/create',
        {
          ...formData,
          type: postType,
          images: imageUrls,
          videoUrl: videoUrl,
          files: files
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Post created:', response.data);
      onPostCreated();
    } catch (err) {
      console.error('Post creation error:', err);
      setError(err.response?.data?.msg || err.message || 'Post creation failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create Post</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Post Type Selection */}
          <div className="form-group">
            <label>Post Type</label>
            <div className="post-type-buttons">
              <button
                type="button"
                className={`post-type-btn ${postType === 'text' ? 'active' : ''}`}
                onClick={() => setPostType('text')}
                title="Text Post"
              >
                📝
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'image' ? 'active' : ''}`}
                onClick={() => setPostType('image')}
                title="Image Post"
              >
                🖼️
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'video' ? 'active' : ''}`}
                onClick={() => setPostType('video')}
                title="Video Post"
              >
                🎥
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'link' ? 'active' : ''}`}
                onClick={() => setPostType('link')}
                title="Link Post"
              >
                🔗
              </button>
              <button
                type="button"
                className={`post-type-btn ${postType === 'article' ? 'active' : ''}`}
                onClick={() => setPostType('article')}
                title="Article with Files"
              >
                📰
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter an interesting title..."
              maxLength="200"
              required
            />
          </div>

          {/* Content */}
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="What's on your mind?"
              rows="6"
              maxLength="5000"
              required
            />
            <small>{formData.content.length}/5000</small>
          </div>

          {/* Image Upload */}
          {postType === 'image' && (
            <div className="form-group">
              <label htmlFor="images">Upload Images (Max 10)</label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
              />
              {selectedImages.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedImages.length} image(s) selected
                </div>
              )}
            </div>
          )}

          {/* Video Upload */}
          {postType === 'video' && (
            <div className="form-group">
              <label htmlFor="video">Upload Video (Max 500MB)</label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoSelect}
              />
              {selectedVideo && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedVideo.name} ({(selectedVideo.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>
          )}

          {/* File Upload (Mods, etc) */}
          {postType === 'article' && (
            <div className="form-group">
              <label htmlFor="files">Attach Files (Max 5, 100MB each)</label>
              <input
                type="file"
                id="files"
                multiple
                onChange={handleFilesSelect}
              />
              {selectedFiles.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  {selectedFiles.length} file(s) selected
                </div>
              )}
            </div>
          )}

          {/* Link URL */}
          {postType === 'link' && (
            <div className="form-group">
              <label htmlFor="linkUrl">Link URL</label>
              <input
                type="url"
                id="linkUrl"
                name="linkUrl"
                value={formData.linkUrl}
                onChange={handleChange}
                placeholder="https://example.com"
                required
              />
              <small>Share an interesting link with the community</small>
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={uploading}
              style={{ flex: 1 }}
            >
              {uploading ? 'Posting...' : 'Post'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-large"
              onClick={onClose}
              disabled={uploading}
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
