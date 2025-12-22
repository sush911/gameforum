import React, { useState } from 'react';
import axios from 'axios';

function CreatePost({ onPostCreated }) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/posts',
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setContent('');
      onPostCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <h2>create a post</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="post title"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="what's on your mind?"
            rows="6"
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
