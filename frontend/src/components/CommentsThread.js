import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CommentItem({ comment, postId, currentUser, token, onUpdate, isReply = false, parentCommentId = null }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [likes, setLikes] = useState(comment.likes || 0);
  const [userLiked, setUserLiked] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      await axios.post(
        `http://localhost:3000/api/posts/${postId}/comments/${parentCommentId || comment._id}/reply`,
        { content: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText('');
      setShowReplyForm(false);
      onUpdate();
    } catch (err) {
      console.error('Reply failed:', err);
      alert('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async () => {
    try {
      const commentIdToLike = parentCommentId || comment._id;
      const response = await axios.post(
        `http://localhost:3000/api/posts/${postId}/comments/${commentIdToLike}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLikes(response.data.likes);
      setUserLiked(response.data.liked);
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this ' + (isReply ? 'reply' : 'comment') + '?')) return;
    
    try {
      if (isReply && parentCommentId) {
        // Delete reply
        await axios.delete(
          `http://localhost:3000/api/posts/${postId}/comments/${parentCommentId}/replies/${comment._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Delete comment
        await axios.delete(
          `http://localhost:3000/api/posts/${postId}/comments/${comment._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      onUpdate();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  };

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
      marginLeft: isReply ? '40px' : '0'
    }}>
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        {comment.avatar ? (
          <img
            src={`http://localhost:3000${comment.avatar}`}
            alt={comment.authorName}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: '#0079D3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            {(comment.authorName || 'A')[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div style={{ flex: 1 }}>
        {/* Author and Time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#030303' }}>
            @{comment.authorName || 'Anonymous'}
          </span>
          <span style={{ fontSize: '12px', color: '#606060' }}>
            {formatTime(comment.createdAt)}
          </span>
        </div>

        {/* Comment Text */}
        <p style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          lineHeight: '20px',
          color: '#030303',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {comment.content}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          {/* Like Button */}
          <button
            onClick={handleLike}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 500,
              color: userLiked ? '#ff4458' : '#606060',
              backgroundColor: 'transparent',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f2f2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill={userLiked ? '#ff4458' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
            </svg>
            <span>{likes > 0 ? likes : ''}</span>
          </button>

          {/* Reply Button - Only show for main comments */}
          {!isReply && currentUser && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#606060',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Reply
            </button>
          )}

          {/* Delete Button */}
          {currentUser && (currentUser._id === comment.userId || currentUser.role === 'Admin') && (
            <button
              onClick={handleDelete}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#cc0000',
                transition: 'background-color 0.1s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff0f0'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Delete
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && currentUser && (
          <div style={{ marginTop: '12px', marginBottom: '16px' }}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Add a reply..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '2px',
                border: '1px solid #ccc',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '60px',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#065fd4';
                e.target.style.outline = 'none';
              }}
              onBlur={(e) => e.target.style.borderColor = '#ccc'}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#606060',
                  border: 'none',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px',
                  transition: 'background-color 0.1s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                disabled={submitting || !replyText.trim()}
                style={{
                  padding: '10px 16px',
                  background: submitting || !replyText.trim() ? '#f2f2f2' : '#065fd4',
                  color: submitting || !replyText.trim() ? '#909090' : 'white',
                  border: 'none',
                  borderRadius: '18px',
                  cursor: submitting || !replyText.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                {submitting ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            {comment.replies.map((reply, idx) => (
              <CommentItem
                key={reply._id || idx}
                comment={reply}
                postId={postId}
                currentUser={currentUser}
                token={token}
                onUpdate={onUpdate}
                isReply={true}
                parentCommentId={comment._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommentsThread({ postId, currentUser, token }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/posts/${postId}/comments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(
        `http://localhost:3000/api/posts/${postId}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #e0e0e0'
    }}>
      <h3 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '24px', color: '#030303' }}>
        {comments.length} Comment{comments.length !== 1 ? 's' : ''}
      </h3>

      {/* New Comment Form */}
      {currentUser ? (
        <form onSubmit={handleAddComment} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {currentUser.avatar ? (
                <img
                  src={`http://localhost:3000${currentUser.avatar}`}
                  alt={currentUser.username}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#0079D3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {(currentUser.username || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  width: '100%',
                  padding: '8px 0',
                  border: 'none',
                  borderBottom: '1px solid #ccc',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  minHeight: '24px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderBottomColor = '#030303';
                  e.target.style.borderBottomWidth = '2px';
                }}
                onBlur={(e) => {
                  if (!newComment.trim()) {
                    e.target.style.borderBottomColor = '#ccc';
                    e.target.style.borderBottomWidth = '1px';
                  }
                }}
              />
              {newComment.trim() && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setNewComment('')}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      color: '#606060',
                      border: 'none',
                      borderRadius: '18px',
                      cursor: 'pointer',
                      fontWeight: 500,
                      fontSize: '14px',
                      transition: 'background-color 0.1s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f2f2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      padding: '10px 16px',
                      background: submitting ? '#f2f2f2' : '#065fd4',
                      color: submitting ? '#909090' : 'white',
                      border: 'none',
                      borderRadius: '18px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: 500,
                      fontSize: '14px'
                    }}
                  >
                    {submitting ? 'Commenting...' : 'Comment'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <div style={{
          background: '#f9f9f9',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '32px',
          textAlign: 'center',
          color: '#606060',
          fontSize: '14px'
        }}>
          Log in to leave a comment
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#606060' }}>
          Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <div>
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              currentUser={currentUser}
              token={token}
              onUpdate={fetchComments}
              isReply={false}
              parentCommentId={null}
            />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#606060',
          fontSize: '14px'
        }}>
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
}

export default CommentsThread;
