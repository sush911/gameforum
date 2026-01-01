import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommentsSection({ postId, currentUser, isLocked }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('new');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/posts/${postId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments');
    }
  };

  const getSortedComments = () => {
    let sorted = [...comments];
    if (sortBy === 'new') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'top') {
      sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return sorted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/api/comments',
        { postId, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (commentId) => {
    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/comments/${commentId}/reply`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to post reply');
    }
  };

  const handleLike = async (commentId) => {
    if (!currentUser) {
      alert('Please login to like comments');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/comments/${commentId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchComments();
    } catch (err) {
      console.error('Failed to like comment');
    }
  };

  const handleReport = async (commentId) => {
    if (!currentUser) {
      alert('Please login to report comments');
      return;
    }

    const reason = prompt('Why are you reporting this comment?');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/comments/${commentId}/report`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Comment reported successfully');
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to report comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchComments();
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  const sortedComments = getSortedComments();

  return (
    <div className="comments-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
          Comments ({comments.length})
        </h3>
        
        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`feed-tab ${sortBy === 'new' ? 'active' : ''}`}
            onClick={() => setSortBy('new')}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            New
          </button>
          <button
            className={`feed-tab ${sortBy === 'oldest' ? 'active' : ''}`}
            onClick={() => setSortBy('oldest')}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Oldest
          </button>
          <button
            className={`feed-tab ${sortBy === 'top' ? 'active' : ''}`}
            onClick={() => setSortBy('top')}
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Top
          </button>
        </div>
      </div>

      {/* Add Comment Form */}
      {currentUser && !isLocked ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="What are your thoughts?"
            rows="3"
            maxLength="1000"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <small style={{ color: 'var(--text-muted)' }}>{newComment.length}/1000</small>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !newComment.trim()}
            >
              {loading ? 'Posting...' : 'Comment'}
            </button>
          </div>
        </form>
      ) : isLocked ? (
        <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          🔒 Comments are locked by moderators
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          <a href="/login" style={{ color: 'var(--primary)' }}>Login</a> to comment
        </div>
      )}

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedComments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
            No comments yet. Be the first to comment!
          </p>
        ) : (
          sortedComments.map(comment => (
            <div key={comment._id} className="comment-item">
              <div className="comment-header">
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--bg-primary)'
                  }}
                >
                  {comment.user?.avatar ? (
                    <img
                      src={`http://localhost:3000${comment.user.avatar}`}
                      alt={comment.user.username}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    comment.user?.username?.[0]?.toUpperCase() || '?'
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="comment-author">
                      {comment.user?.username || 'Unknown'}
                    </span>
                    {comment.user?.role && comment.user.role !== 'User' && (
                      <span className={`role-badge ${comment.user.role.toLowerCase()}`}>
                        {comment.user.role}
                      </span>
                    )}
                    <span className="comment-time">
                      • {formatTime(comment.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="comment-content">
                {comment.content}
              </p>

              {/* Comment Actions */}
              <div className="comment-actions">
                <button
                  className="comment-action"
                  onClick={() => handleLike(comment._id)}
                  disabled={!currentUser}
                >
                  👍 {comment.likes || 0}
                </button>
                <button
                  className="comment-action"
                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  disabled={!currentUser}
                >
                  💬 Reply
                </button>
                <button
                  className="comment-action"
                  onClick={() => handleReport(comment._id)}
                  disabled={!currentUser}
                >
                  🚩 Report
                </button>
                {currentUser && (comment.user?._id === currentUser._id || currentUser.role === 'Admin') && (
                  <button
                    className="comment-action"
                    onClick={() => handleDelete(comment._id)}
                    style={{ color: 'var(--danger)' }}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>

              {/* Reply Form */}
              {replyingTo === comment._id && (
                <div style={{ marginTop: '12px', marginLeft: '36px' }}>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows="2"
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '6px',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                    maxLength="500"
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleReply(comment._id)}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Reply
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Show Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div style={{ marginTop: '12px', marginLeft: '36px', paddingLeft: '12px', borderLeft: '2px solid var(--border-primary)' }}>
                  {comment.replies.map(reply => (
                    <div key={reply._id} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>
                          {reply.user?.username || 'Unknown'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {formatTime(reply.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CommentsSection;
