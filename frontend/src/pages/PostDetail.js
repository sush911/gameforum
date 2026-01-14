import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiTrash2, FiEdit2 } from 'react-icons/fi';
import Navbar from '../components/Navbar';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchPost();
  }, [id]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get('http://localhost:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`http://localhost:3000/api/posts/${id}`, { headers });
      setPost(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch post:', err);
      setError('Post not found');
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/posts/${post._id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPost();
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3000/api/posts/${post._id}/comments`,
        { content: comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment('');
      fetchPost();
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${post._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${post._id}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPost();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  if (loading) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: '48px', height: '48px', border: '4px solid #e0e0e0', borderTop: '4px solid #0079D3', borderRadius: '50%' }}
          />
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Post Not Found</h2>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700
            }}
          >
            Go Home
          </button>
        </div>
      </>
    );
  }

  const isOwner = user && post.user && (user._id === post.user._id || user._id === post.user);
  const isAdmin = user?.role === 'Admin';
  const canDelete = isOwner || isAdmin;

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
      
      <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 24px' }}>
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            // Navigate back to community if post has category, otherwise go to home
            if (post.category?.slug) {
              navigate(`/community/${post.category.slug}`);
            } else {
              navigate('/');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#f6f7f9',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            marginBottom: '24px',
            color: '#333'
          }}
        >
          <FiArrowLeft size={20} />
          Back to {post.category?.name || 'Home'}
        </motion.button>

        {/* Post Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          {/* Post Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
              <Link to={`/user/${post.user?.username || 'unknown'}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: '#0079D3',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '18px',
                  overflow: 'hidden'
                }}>
                  {post.user?.avatar ? (
                    <img src={`http://localhost:3000${post.user.avatar}`} alt={post.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    post.user?.username?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
              </Link>
              <div>
                <Link to={`/user/${post.user?.username || 'unknown'}`} style={{ textDecoration: 'none', color: '#1a1a1a' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                    {post.user?.username || 'Unknown'}
                  </div>
                </Link>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {post.category?.name || 'General'}
                </div>
              </div>
            </div>
            
            {canDelete && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FiMoreVertical size={20} color="#666" />
                </button>
                {showMenu && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        minWidth: '150px',
                        marginTop: '8px'
                      }}
                    >
                      <button
                        onClick={handleDeletePost}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#E74C3C',
                          fontWeight: 600
                        }}
                      >
                        <FiTrash2 size={16} />
                        Delete Post
                      </button>
                    </div>
                    <div
                      onClick={() => setShowMenu(false)}
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* Post Title */}
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px', lineHeight: '1.3' }}>
            {post.title}
          </h1>

          {/* Post Content */}
          {post.content && (
            <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {post.content}
            </p>
          )}

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {post.images.map((img, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:3000${img}`}
                  alt={`Post image ${idx + 1}`}
                  style={{
                    width: '100%',
                    maxHeight: '600px',
                    objectFit: 'contain',
                    borderRadius: '12px',
                    marginBottom: '12px'
                  }}
                />
              ))}
            </div>
          )}

          {/* Post Video */}
          {post.videoUrl && (
            <video
              controls
              style={{
                width: '100%',
                maxHeight: '600px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}
            >
              <source src={`http://localhost:3000${post.videoUrl}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}

          {/* Poll */}
          {post.type === 'poll' && post.pollOptions && (
            <div style={{ marginBottom: '20px' }}>
              {post.pollOptions.map((option, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    background: '#f6f7f9',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{option.text}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{option.votes || 0} votes</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div style={{ display: 'flex', gap: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: post.likes?.includes(user?._id) ? '#fee' : '#f6f7f9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                color: post.likes?.includes(user?._id) ? '#E74C3C' : '#666'
              }}
            >
              <FiHeart size={18} fill={post.likes?.includes(user?._id) ? '#E74C3C' : 'none'} />
              {post.upvotes || 0}
            </motion.button>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: '#f6f7f9',
              borderRadius: '8px',
              fontWeight: 600,
              color: '#666'
            }}>
              <FiMessageCircle size={18} />
              {post.comments?.length || 0}
            </div>
          </div>
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>
            Comments ({post.comments?.length || 0})
          </h2>

          {/* Comment Form */}
          {user ? (
            <form onSubmit={handleCommentSubmit} style={{ marginBottom: '32px' }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What are your thoughts?"
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '14px 16px',
                  fontSize: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!comment.trim() || submittingComment}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  opacity: (!comment.trim() || submittingComment) ? 0.5 : 1
                }}
              >
                {submittingComment ? 'Posting...' : 'Comment'}
              </motion.button>
            </form>
          ) : (
            <div style={{ padding: '20px', background: '#f6f7f9', borderRadius: '8px', textAlign: 'center', marginBottom: '32px' }}>
              <p style={{ marginBottom: '12px' }}>Log in to comment</p>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 700
                }}
              >
                Log In
              </button>
            </div>
          )}

          {/* Comments List */}
          {post.comments && post.comments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {post.comments.map((comment, idx) => {
                const isCommentOwner = user && comment.user && (user._id === comment.user._id || user._id === comment.user);
                const canDeleteComment = isCommentOwner || isAdmin;
                
                return (
                  <motion.div
                    key={comment._id || idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      padding: '20px',
                      background: '#f6f7f9',
                      borderRadius: '12px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Link to={`/user/${comment.user?.username || 'unknown'}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#0079D3',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {comment.user?.avatar ? (
                            <img src={`http://localhost:3000${comment.user.avatar}`} alt={comment.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            comment.user?.username?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                      </Link>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <Link to={`/user/${comment.user?.username || 'unknown'}`} style={{ textDecoration: 'none', color: '#1a1a1a' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px' }}>
                                {comment.user?.username || 'Unknown'}
                              </span>
                            </Link>
                            <span style={{ fontSize: '13px', color: '#666', marginLeft: '8px' }}>
                              {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {canDeleteComment && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                color: '#E74C3C'
                              }}
                            >
                              <FiTrash2 size={16} />
                            </button>
                          )}
                        </div>
                        <p style={{ fontSize: '15px', lineHeight: '1.5', color: '#333', whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

export default PostDetail;
