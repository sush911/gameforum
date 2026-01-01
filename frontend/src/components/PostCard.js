import React, { useState } from 'react';
import axios from 'axios';
import CommentsSection from './CommentsSection';

function PostCard({ post, currentUser, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [upvotes, setUpvotes] = useState(post.upvotes || 0);
  const [downvotes, setDownvotes] = useState(post.downvotes || 0);
  
  // Check if current user has voted
  const getUserVote = () => {
    if (!currentUser || !post.votedBy) return null;
    const vote = post.votedBy.find(v => v.user === currentUser._id || v.user._id === currentUser._id);
    return vote ? vote.vote : null;
  };
  
  const [userVote, setUserVote] = useState(getUserVote());

  const handleVote = async (voteType) => {
    if (!currentUser) {
      alert('Please login to vote');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/posts/${post._id}/vote`,
        { vote: voteType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUpvotes(response.data.upvotes);
      setDownvotes(response.data.downvotes);
      setUserVote(response.data.userVote);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  const score = upvotes - downvotes;

  return (
    <article className={`post-card ${post.isPinned ? 'pinned' : ''}`}>
      {post.isPinned && (
        <div style={{ color: 'var(--warning)', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
          📌 PINNED BY MODERATOR
        </div>
      )}

      <div className="post-header">
        <div className="post-avatar">
          {post.user?.avatar ? (
            <img src={`http://localhost:3000${post.user.avatar}`} alt={post.user.username} />
          ) : (
            post.user?.username?.[0]?.toUpperCase() || '?'
          )}
        </div>
        
        <div className="post-meta">
          <div className="post-author">
            <span>{post.user?.username || 'Unknown'}</span>
            {post.user?.role && post.user.role !== 'User' && (
              <span className={`role-badge ${post.user.role.toLowerCase()}`}>
                {post.user.role}
              </span>
            )}
          </div>
          <div className="post-time">
            {post.category && (
              <span
                className="post-category-badge"
                style={{ background: post.category.color + '20', color: post.category.color }}
              >
                {post.category.icon} {post.category.name}
              </span>
            )}
            {' • '}
            {formatTime(post.createdAt)}
          </div>
        </div>
      </div>

      <h2 className="post-title">{post.title}</h2>
      
      <div className="post-content">
        {post.content}
      </div>

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div className="post-images">
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={`http://localhost:3000${img}`}
              alt={`Post image ${idx + 1}`}
              className="post-image"
            />
          ))}
        </div>
      )}

      {/* Video */}
      {post.videoUrl && (
        <div style={{ marginBottom: '16px' }}>
          <video
            controls
            style={{ width: '100%', borderRadius: '12px' }}
            src={`http://localhost:3000${post.videoUrl}`}
          />
        </div>
      )}

      {/* Files/Attachments */}
      {post.files && post.files.length > 0 && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
            📎 ATTACHMENTS
          </div>
          {post.files.map((file, idx) => (
            <a
              key={idx}
              href={`http://localhost:3000${file.url}`}
              download
              style={{
                display: 'block',
                padding: '8px 12px',
                marginBottom: '4px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--primary)',
                textDecoration: 'none',
                fontSize: '13px'
              }}
            >
              💾 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </a>
          ))}
        </div>
      )}

      {/* Link */}
      {post.linkUrl && (
        <div style={{ marginBottom: '16px' }}>
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--border-primary)',
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '14px'
            }}
          >
            🔗 {post.linkUrl}
          </a>
        </div>
      )}

      <div className="post-footer">
        {/* Upvote only */}
        <button
          className={`post-action ${userVote === 'up' ? 'upvoted' : ''}`}
          onClick={() => handleVote('up')}
          disabled={!currentUser}
        >
          ⬆️ {upvotes}
        </button>

        {/* Comments */}
        <button
          className="post-action"
          onClick={() => setShowComments(!showComments)}
        >
          💬 Comments
        </button>

        {/* Share */}
        <button
          className="post-action"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied!');
          }}
        >
          🔗 Share
        </button>

        {/* Delete (if owner or admin) */}
        {currentUser && (post.user?._id === currentUser._id || currentUser.role === 'Admin') && (
          <button className="post-action" onClick={handleDelete} style={{ marginLeft: 'auto', color: 'var(--danger)' }}>
            🗑️ Delete
          </button>
        )}
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentsSection
          postId={post._id}
          currentUser={currentUser}
          isLocked={post.isLocked}
        />
      )}
    </article>
  );
}

export default PostCard;
