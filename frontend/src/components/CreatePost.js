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
    <div className="create-post-card" role="region" aria-labelledby="create-post-heading">
      <h2 id="create-post-heading">post something cool 💬</h2>
      {error && <div className="alert alert-error" role="alert" aria-live="polite">{error}</div>}
      <form onSubmit={handleSubmit} aria-label="Create new post">
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
            aria-label="Post title"
            aria-required="true"
            aria-invalid={error && title.length < 5 ? "true" : "false"}
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
            aria-label="Post content"
            aria-required="true"
            aria-describedby="content-counter"
            aria-invalid={error && content.length < 10 ? "true" : "false"}
          />
          <small id="content-counter" aria-live="polite">{content.length}/5000</small>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          aria-label={loading ? 'Posting your content' : 'Submit post'}
        >
          {loading ? 'posting...' : 'post it'}
        </button>
      </form>
    </div>
  );
}

export default CreatePost;
