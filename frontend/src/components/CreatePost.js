import React, { useState } from 'react';
import axios from 'axios';

function CreatePost({ onPostCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      await axios.post(
        'http://localhost:3000/api/posts',
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle('');
      setContent('');
      if (onPostCreated) onPostCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'post failed lol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-card">
      <h2>post something cool 💬</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="what's on ur mind?"
            maxLength="200"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">what u wanna say</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="say whatever..."
            maxLength="5000"
            rows="5"
            disabled={loading}
          />
          <small>{content.length}/5000</small>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'posting...' : 'post it'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;
