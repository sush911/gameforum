import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CreatePost({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/categories');
      setCategories(response.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 10) {
      setError('Maximum 10 images per post');
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is too large (max 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [...prev, file]);
        setImagePreviews((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024 * 1024) {
      setError('Video must be less than 500MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setVideo({ base64: e.target.result, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    setVideo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('need a title and some text bro');
      return;
    }

    if (title.length < 5) {
      setError('title too short (min 5 chars)');
      return;
    }

    if (content.length < 10) {
      setError('write something longer dude');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Create post first
      const postResponse = await axios.post(
        'http://localhost:3000/api/posts',
        { 
          title, 
          content,
          category: category || 'General'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const postId = postResponse.data._id || postResponse.data.id;

      // Upload images if any
      if (images.length > 0) {
        const formData = new FormData();
        images.forEach((img) => {
          formData.append('images', img);
        });

        try {
          await axios.post(
            `http://localhost:3000/api/posts/${postId}/upload-images`,
            formData,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              } 
            }
          );
        } catch (imgErr) {
          console.error('Image upload error:', imgErr);
          // Don't fail the post if images fail
        }
      }

      // Upload video if any
      if (video) {
        const formData = new FormData();
        formData.append('video', video);

        try {
          await axios.post(
            `http://localhost:3000/api/posts/${postId}/upload-video`,
            formData,
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              } 
            }
          );
        } catch (vidErr) {
          console.error('Video upload error:', vidErr);
          // Don't fail the post if video fails
        }
      }

      setTitle('');
      setContent('');
      setImages([]);
      setVideo(null);
      setImagePreviews([]);
      setCategory('');
      if (onPostCreated) onPostCreated();
    } catch (err) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'post failed lol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-card" style={styles.container}>
      {/* Quick Post Prompt */}
      {!showForm && (
        <div style={styles.quickPostBox}>
          <input
            type="text"
            placeholder="What's on your mind? Share your thoughts..."
            style={styles.quickPostInput}
            onClick={() => setShowForm(true)}
            readOnly
          />
          <div style={styles.quickPostActions}>
            <button 
              type="button"
              onClick={() => setShowForm(true)}
              style={styles.quickPostButton}
              title="Add images"
            >
              📸 Images
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(true)}
              style={styles.quickPostButton}
              title="Add video"
            >
              🎥 Video
            </button>
            <button 
              type="button"
              onClick={() => setShowForm(true)}
              style={styles.quickPostButton}
              title="Create post"
            >
              ✍️ Post
            </button>
          </div>
        </div>
      )}

      {/* Full Post Form */}
      {showForm && (
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>Create a Post</h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError('');
                setSuccess('');
              }}
              style={styles.closeButton}
              title="Close"
            >
              ✕
            </button>
          </div>

          {error && <div style={styles.alert('error')}>{error}</div>}
          {success && <div style={styles.alert('success')}>{success}</div>}

          <form onSubmit={handleSubmit} style={styles.form} aria-label="Create new post">
            {/* Title */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title..."
                maxLength="200"
                disabled={loading}
                style={styles.input}
                aria-label="Post title"
                aria-required="true"
              />
              <span style={styles.charCount}>{title.length}/200</span>
            </div>

            {/* Category */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                style={styles.select}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id || cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here (minimum 10 characters)..."
                maxLength="5000"
                rows="6"
                disabled={loading}
                style={styles.textarea}
                aria-label="Post content"
                aria-required="true"
              />
              <span style={styles.charCount}>{content.length}/5000</span>
            </div>

            {/* Images */}
            <div style={styles.formGroup}>
              <label style={styles.label}>📸 Images (up to 10, 5MB each)</label>
              <label style={styles.fileInputLabel}>
                <span style={styles.fileInputButton}>Choose Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={loading}
                  style={{ display: 'none' }}
                  aria-label="Upload images"
                />
              </label>
              
              {images.length > 0 && (
                <div style={styles.imagePreviewSection}>
                  <p style={styles.previewCount}>{images.length} image(s) selected</p>
                  <div style={styles.imageGrid}>
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} style={styles.imagePreview}>
                        <img
                          src={preview}
                          alt={`Preview ${idx}`}
                          style={styles.previewImg}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          style={styles.removeButton}
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Video */}
            <div style={styles.formGroup}>
              <label style={styles.label}>🎥 Video (max 500MB)</label>
              <label style={styles.fileInputLabel}>
                <span style={styles.fileInputButton}>Choose Video</span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  disabled={loading}
                  style={{ display: 'none' }}
                  aria-label="Upload video"
                />
              </label>
              
              {video && (
                <div style={styles.videoPreviewSection}>
                  <div style={styles.videoInfo}>
                    <span style={styles.videoName}>🎬 {video.name || 'Video selected'}</span>
                    <span style={styles.videoSize}>({(video.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={removeVideo}
                    style={styles.removeButtonSmall}
                    title="Remove video"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              aria-label={loading ? 'Posting your content' : 'Submit post'}
            >
              {loading ? '⏳ Posting...' : '✓ Post'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '20px',
  },
  quickPostBox: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer'
  },
  quickPostInput: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    backgroundColor: '#f9fafb',
    marginBottom: '12px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
    fontFamily: 'inherit'
  },
  quickPostActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  quickPostButton: {
    padding: '8px 16px',
    fontSize: '13px',
    border: '1px solid #e5e7eb',
    borderRadius: '20px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500',
    color: '#374151'
  },
  formContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb'
  },
  formTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px 8px'
  },
  form: {
    padding: '20px'
  },
  formGroup: {
    marginBottom: '20px',
    position: 'relative'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: 'white'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px'
  },
  charCount: {
    position: 'absolute',
    bottom: '-20px',
    right: '0',
    fontSize: '12px',
    color: '#9ca3af'
  },
  fileInputLabel: {
    display: 'inline-block',
    cursor: 'pointer'
  },
  fileInputButton: {
    display: 'inline-block',
    padding: '10px 16px',
    backgroundColor: '#6366f1',
    color: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s'
  },
  imagePreviewSection: {
    marginTop: '12px'
  },
  previewCount: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '10px',
    margin: '12px 0 8px 0'
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
    gap: '10px'
  },
  imagePreview: {
    position: 'relative',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6'
  },
  previewImg: {
    width: '100%',
    height: '80px',
    objectFit: 'cover',
    display: 'block'
  },
  removeButton: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  videoPreviewSection: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  videoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  videoName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  videoSize: {
    fontSize: '12px',
    color: '#6b7280'
  },
  removeButtonSmall: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: '#6366f1',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  alert: (type) => ({
    padding: '12px 16px',
    marginBottom: '16px',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: type === 'error' ? '#fee2e2' : '#dcfce7',
    color: type === 'error' ? '#991b1b' : '#166534',
    border: `1px solid ${type === 'error' ? '#fecaca' : '#bbf7d0'}`
  })
};

export default CreatePost;
