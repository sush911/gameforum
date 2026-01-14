import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FiBarChart2, FiFileText, FiVideo, FiImage, FiLink 
} from 'react-icons/fi';
import CommentsThread from './CommentsThread';

function PostCard({ post, currentUser, onUpdate }) {
  const [likes, setLikes] = useState(post.upvotes || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [pollOptions, setPollOptions] = useState(post.pollOptions || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  // Initialize poll data
  React.useEffect(() => {
    if (post.type === 'poll' && post.pollOptions) {
      setPollOptions(post.pollOptions);
    }
  }, [post]);

  // Get user data from post
  const author = post.user || {};
  const username = author.username || post.authorName || 'Anonymous';
  const avatar = author.avatar || post.avatar;
  const userId = author._id || post.userId;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? post.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === post.images.length - 1 ? 0 : prev + 1));
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please login to like');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/posts/${post._id || post.id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLikes(response.data.upvotes);
      setUserLiked(response.data.liked);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handlePollVote = async (optionIndex) => {
    if (!currentUser) {
      alert('Please login to vote');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/posts/${post._id || post.id}/poll/vote`,
        { optionIndex },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPollOptions(response.data.pollOptions);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Poll vote failed:', err);
      alert(err.response?.data?.msg || 'Failed to vote');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${post._id || post.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete post');
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post._id || post.id}`;
    
    if (navigator.share) {
      // Use native share if available
      navigator.share({
        title: post.title,
        text: post.content,
        url: postUrl
      }).catch(err => console.log('Share cancelled'));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(postUrl).then(() => {
        alert('Link copied to clipboard!');
      }).catch(() => {
        // Manual fallback
        const textarea = document.createElement('textarea');
        textarea.value = postUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('Link copied to clipboard!');
      });
    }
  };

  // Determine post type and icon
  const getPostTypeIcon = () => {
    if (post.type === 'poll') {
      return { icon: <FiBarChart2 size={16} />, label: 'Poll', color: '#0079D3' };
    }
    if (post.type === 'blog') {
      return { icon: <FiFileText size={16} />, label: 'Blog', color: '#0079D3' };
    }
    if (post.videoUrl) {
      return { icon: <FiVideo size={16} />, label: 'Video', color: '#0079D3' };
    }
    if (post.images && post.images.length > 0) {
      return { icon: <FiImage size={16} />, label: 'Image', color: '#0079D3' };
    }
    if (post.linkUrl) {
      return { icon: <FiLink size={16} />, label: 'Link', color: '#0079D3' };
    }
    return { icon: <FiFileText size={16} />, label: 'Text', color: '#0079D3' };
  };

  const postType = getPostTypeIcon();

  const formatDate = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  };

  const getCategoryName = () => {
    if (post.category) {
      if (typeof post.category === 'object') {
        return post.category.name;
      }
      return post.category;
    }
    return null;
  };

  const formatCategoryDisplay = (categoryName) => {
    if (!categoryName) return null;
    // Remove "r/" prefix if present and format nicely
    const cleanName = categoryName.replace(/^r\//, '');
    return `${cleanName} Community`;
  };

  return (
    <article className="reddit-post-card" style={{ position: 'relative' }}>
      {/* Post Type Badge */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        background: postType.color,
        color: 'white',
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        zIndex: 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <span>{postType.icon}</span>
        <span>{postType.label}</span>
      </div>

      <div className="post-vote-section">
        <button
          className={`vote-btn ${userLiked ? 'active' : ''}`}
          onClick={handleLike}
          title="Like"
          style={{
            background: userLiked ? '#FF4500' : 'transparent',
            color: userLiked ? 'white' : '#878A8C',
            transition: 'all 0.2s'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
          </svg>
        </button>
        <span className="vote-score" style={{ 
          fontWeight: 700,
          color: userLiked ? '#FF4500' : '#1c1c1c'
        }}>{likes}</span>
      </div>

      <div className="post-main-content">
        {/* Post Header */}
        <div className="post-meta-header">
          <div className="post-author-info">
            {avatar ? (
              <img 
                src={`http://localhost:3000${avatar}`} 
                alt={username}
                className="author-avatar"
              />
            ) : (
              <div className="author-avatar-placeholder">
                {username[0]?.toUpperCase()}
              </div>
            )}
            <div className="post-meta-text">
              {getCategoryName() && post.category?.slug && (
                <span 
                  className="post-category" 
                  onClick={() => navigate(`/community/${post.category.slug}`)}
                  style={{ 
                    fontWeight: 'bold', 
                    fontSize: '16px',
                    color: '#0079D3',
                    cursor: 'pointer'
                  }}
                  title={`View ${getCategoryName()} community`}
                >
                  {formatCategoryDisplay(getCategoryName())}
                </span>
              )}
              <div className="post-author-line">
                <span 
                  className="post-author" 
                  onClick={() => navigate(`/user/${username}`)}
                  style={{ cursor: 'pointer' }}
                  title={`View ${username}'s profile`}
                >
                  {username}
                </span>
                <span className="post-separator">•</span>
                <span className="post-time">{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Title */}
        <h2 
          className="post-title-main" 
          onClick={() => navigate(`/post/${post._id}`)}
          style={{ cursor: 'pointer' }}
          title="View full post"
        >
          {post.title}
        </h2>

        {/* Post Content */}
        {post.content && (
          <div className="post-text-content">{post.content}</div>
        )}

        {/* Poll */}
        {post.type === 'poll' && pollOptions && pollOptions.length > 0 && (
          <div style={{
            background: '#f6f7f8',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            marginTop: '12px'
          }}>
            <div style={{ marginBottom: '12px', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiBarChart2 size={18} style={{ color: '#0079D3' }} />
              {post.title}
            </div>
            {pollOptions.map((option, index) => {
              const totalVotes = pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);
              const percentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes * 100).toFixed(1) : 0;
              const userVoted = currentUser && option.votedBy && option.votedBy.includes(currentUser._id || currentUser.id);
              const pollEnded = post.pollEndsAt && new Date(post.pollEndsAt) < new Date();
              
              return (
                <div
                  key={index}
                  onClick={() => !pollEnded && handlePollVote(index)}
                  style={{
                    position: 'relative',
                    padding: '12px',
                    marginBottom: '8px',
                    border: userVoted ? '2px solid #0079D3' : '1px solid #ccc',
                    borderRadius: '6px',
                    cursor: pollEnded ? 'not-allowed' : 'pointer',
                    background: 'white',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    opacity: pollEnded ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => !pollEnded && (e.currentTarget.style.background = '#f0f0f0')}
                  onMouseLeave={(e) => !pollEnded && (e.currentTarget.style.background = 'white')}
                >
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${percentage}%`,
                    background: userVoted ? 'rgba(0, 121, 211, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                    transition: 'width 0.3s'
                  }} />
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: userVoted ? 600 : 400 }}>
                      {userVoted && '✓ '}{option.text}
                    </span>
                    <span style={{ fontWeight: 600, color: '#0079D3' }}>
                      {percentage}% ({option.votes || 0})
                    </span>
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#878A8C', textAlign: 'center' }}>
              {pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0)} total votes
              {post.pollEndsAt && (
                <span>
                  {' • '}
                  {new Date(post.pollEndsAt) < new Date() 
                    ? `Ended ${new Date(post.pollEndsAt).toLocaleDateString()}`
                    : `Ends ${new Date(post.pollEndsAt).toLocaleDateString()}`
                  }
                </span>
              )}
            </div>
          </div>
        )}

        {/* Images with Carousel */}
        {post.images && post.images.length > 0 && (
          <div style={{ position: 'relative', marginTop: '12px' }}>
            <img
              src={post.images[currentImageIndex].startsWith('http') ? post.images[currentImageIndex] : `http://localhost:3000${post.images[currentImageIndex]}`}
              alt={`${post.title} - ${currentImageIndex + 1}`}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '600px',
                objectFit: 'contain',
                borderRadius: '8px',
                background: '#000',
                cursor: 'pointer'
              }}
              onClick={() => window.open(post.images[currentImageIndex].startsWith('http') ? post.images[currentImageIndex] : `http://localhost:3000${post.images[currentImageIndex]}`, '_blank')}
            />
            
            {/* Navigation Arrows - Only show if multiple images */}
            {post.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    zIndex: 2
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
                >
                  ‹
                </button>
                <button
                  onClick={handleNextImage}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                    zIndex: 2
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)'}
                >
                  ›
                </button>
                
                {/* Image Counter */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {currentImageIndex + 1} / {post.images.length}
                </div>
                
                {/* Dot Indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '6px'
                }}>
                  {post.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        border: 'none',
                        background: idx === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Video */}
        {post.videoUrl && (
          <video
            src={post.videoUrl.startsWith('http') ? post.videoUrl : `http://localhost:3000${post.videoUrl}`}
            className="post-video"
            controls
            style={{ maxWidth: '100%', borderRadius: '8px' }}
          />
        )}

        {/* Post Actions */}
        <div className="post-actions-bar">
          <button 
            className="post-action-btn"
            onClick={() => setShowComments(!showComments)}
            style={{
              background: showComments ? 'rgba(0, 121, 211, 0.1)' : 'transparent',
              color: showComments ? '#0079D3' : '#878A8C'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 4a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H6l-4 4V4z"/>
            </svg>
            <span>{post.commentCount || 0} Comments</span>
          </button>

          <button className="post-action-btn" onClick={handleShare}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 100-6 3 3 0 000 6zM5 12a3 3 0 100-6 3 3 0 000 6zM15 18a3 3 0 100-6 3 3 0 000 6z"/>
              <path d="M7.5 10.5l5-2.5M7.5 13.5l5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>Share</span>
          </button>

          {currentUser && (currentUser._id === userId || currentUser.id === userId || currentUser.role === 'Admin') && (
            <button 
              className="post-action-btn delete-btn" 
              onClick={handleDelete}
              style={{
                color: '#E74C3C'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <span>Delete</span>
            </button>
          )}
        </div>

        {/* Comments Section */}
        {showComments && currentUser && (
          <CommentsThread 
            postId={post._id || post.id} 
            currentUser={currentUser} 
            token={localStorage.getItem('token')}
          />
        )}
      </div>
    </article>
  );
}

export default PostCard;
