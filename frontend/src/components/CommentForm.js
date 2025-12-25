import React, { useState } from 'react';
import axios from 'axios';

function CommentForm({ postId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!content.trim() || content.trim().length < 2) {
      setError('comment too short bro');
      return;
    }

    if (content.length > 1000) {
      setError('too long');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/comments',
        { postId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'couldnt post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-form">
      {error && <div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="reply to this post..."
          rows="3"
          maxLength="1000"
          disabled={loading}
        />
        <small>{content.length}/1000</small>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !content.trim()}
        >
          {loading ? 'posting...' : 'reply'}
        </button>
      </form>
    </div>
  );
}

export default CommentForm;



