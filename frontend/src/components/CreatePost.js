import React, { useState } from 'react';
import axios from 'axios';

function CreatePost({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!title.trim()) {
      setError('need a title');
      return false;
    }
    if (!content.trim()) {
      setError('need some content');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/posts',
        { title: title.trim(), content: content.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setContent('');
      onPostCreated();
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (!err.response) {
        setError('no connection');
      } else {
        setError('couldnt post');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <h2>new post</h2>
      {error && <div className="error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="post title"
            maxLength="200"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            placeholder="what's on your mind?"
            rows="6"
            maxLength="5000"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'posting...' : 'post'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;
