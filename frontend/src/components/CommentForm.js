import React, { useState } from 'react';
import axios from 'axios';

function CommentForm({ postId, onCommentAdded }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/comments',
        { postId, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent('');
      onCommentAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-form">
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="add a comment..."
            rows="3"
            required
            minLength="2"
            maxLength="1000"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'posting...' : 'comment'}
        </button>
      </form>
    </div>
  );
}

export default CommentForm;
