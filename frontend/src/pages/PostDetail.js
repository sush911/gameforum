import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiTrash2, FiEdit2, FiClock, FiUser } from 'react-icons/fi';
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 1, repeat: Infinity, ease: "linear" },
              scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
            }}
            style={{ 
              width: '64px', 
              height: '64px', 
              border: '5px solid rgba(0, 121, 211, 0.1)', 
              borderTop: '5px solid #0079D3', 
              borderRadius: '50%',
              boxShadow: '0 4px 20px rgba(0, 121, 211, 0.3)'
            }}
          />
        </div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navbar user={user} handleLogout={handleLogout} />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ 
            maxWidth: '800px', 
            margin: '80px auto', 
            padding: '0 24px', 
            textAlign: 'center' 
          }}
        >
          <motion.div 
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 0.6 }}
            style={{ fontSize: '96px', marginBottom: '24px', filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.1))' }}
          >
            🔍
          </motion.div>
          <h2 style={{ 
            fontSize: '32px', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800
          }}>
            Post Not Found
          </h2>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>
            The post you're looking for doesn't exist or has been removed.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(0, 121, 211, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            style={{
              padding: '16px 40px',
              background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '16px',
              boxShadow: '0 4px 20px rgba(0, 121, 211, 0.3)'
            }}
          >
            Go Home
          </motion.button>
        </motion.div>
      </>
    );
  }

  const isOwner = user && post.user && (user._id === post.user._id || user._id === post.user);
  const isAdmin = user?.role === 'Admin';
  const canDelete = isOwner || isAdmin;

  return (
    <>
      <Navbar user={user} handleLogout={handleLogout} />
      
      <div style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        paddingBottom: '80px'
      }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', padding: '40px 24px' }}>
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ 
              scale: 1.03,
              x: -5,
              boxShadow: '0 6px 25px rgba(0,0,0,0.12)'
            }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (post.category?.slug) {
                navigate(`/community/${post.category.slug}`);
              } else {
                navigate('/');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 24px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0, 121, 211, 0.1)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              marginBottom: '32px',
              color: '#0079D3',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              fontSize: '15px'
            }}
          >
            <FiArrowLeft size={20} />
            Back to {post.category?.name || 'Home'}
          </motion.button>

          {/* Post Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '24px',
              padding: '40px',
              marginBottom: '32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative gradient overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              backgroundSize: '200% 100%',
              animation: 'gradient 3s ease infinite'
            }} />

            {/* Post Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                <Link to={`/user/${post.user?.username || 'unknown'}`} style={{ textDecoration: 'none' }}>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                      border: '3px solid white'
                    }}
                  >
                    {post.user?.avatar ? (
                      <img src={`http://localhost:3000${post.user.avatar}`} alt={post.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      post.user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </motion.div>
                </Link>
                <div>
                  <Link to={`/user/${post.user?.username || 'unknown'}`} style={{ textDecoration: 'none' }}>
                    <motion.div 
                      whileHover={{ x: 3 }}
                      style={{ 
                        fontWeight: 800, 
                        fontSize: '18px', 
                        marginBottom: '6px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {post.user?.username || 'Unknown'}
                    </motion.div>
                  </Link>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#666' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FiClock size={14} />
                      {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {post.category?.name && (
                      <>
                        <span>•</span>
                        <span style={{
                          padding: '4px 12px',
                          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#667eea'
                        }}>
                          {post.category.name}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {canDelete && (
                <div style={{ position: 'relative' }}>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMenu(!showMenu)}
                    style={{
                      background: 'rgba(102, 126, 234, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '10px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <FiMoreVertical size={20} color="#667eea" />
                  </motion.button>
                  <AnimatePresence>
                    {showMenu && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            background: 'white',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                            zIndex: 100,
                            minWidth: '180px',
                            marginTop: '12px',
                            overflow: 'hidden'
                          }}
                        >
                          <motion.button
                            whileHover={{ background: 'rgba(231, 76, 60, 0.1)', x: 5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleDeletePost}
                            style={{
                              width: '100%',
                              padding: '14px 18px',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              color: '#E74C3C',
                              fontWeight: 600,
                              fontSize: '15px',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <FiTrash2 size={18} />
                            Delete Post
                          </motion.button>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
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
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Post Title */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ 
                fontSize: '36px', 
                fontWeight: 800, 
                marginBottom: '24px', 
                lineHeight: '1.3',
                color: '#1a1a1a',
                letterSpacing: '-0.5px'
              }}
            >
              {post.title}
            </motion.h1>

            {/* Post Content */}
            {post.content && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{ 
                  fontSize: '17px', 
                  lineHeight: '1.8', 
                  color: '#444', 
                  marginBottom: '28px', 
                  whiteSpace: 'pre-wrap'
                }}
              >
                {post.content}
              </motion.p>
            )}

            {/* Post Images */}
            {post.images && post.images.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: '28px' }}
              >
                {post.images.map((img, idx) => (
                  <motion.img
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedImage(img);
                      setImageModalOpen(true);
                    }}
                    src={`http://localhost:3000${img}`}
                    alt={`Post image ${idx + 1}`}
                    style={{
                      width: '100%',
                      maxHeight: '600px',
                      objectFit: 'contain',
                      borderRadius: '16px',
                      marginBottom: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Post Video */}
            {post.videoUrl && (
              <motion.video
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                controls
                style={{
                  width: '100%',
                  maxHeight: '600px',
                  borderRadius: '16px',
                  marginBottom: '28px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                }}
              >
                <source src={`http://localhost:3000${post.videoUrl}`} type="video/mp4" />
                Your browser does not support the video tag.
              </motion.video>
            )}

            {/* Poll */}
            {post.type === 'poll' && post.pollOptions && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ marginBottom: '28px' }}
              >
                {post.pollOptions.map((option, idx) => {
                  const totalVotes = post.pollOptions.reduce((sum, opt) => sum + (opt.votes || 0), 0);
                  const percentage = totalVotes > 0 ? ((option.votes || 0) / totalVotes * 100).toFixed(1) : 0;
                  
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderRadius: '12px',
                        marginBottom: '12px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                          borderRadius: '12px'
                        }}
                      />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '16px', color: '#333' }}>
                          {option.text}
                        </div>
                        <div style={{ fontSize: '14px', color: '#667eea', fontWeight: 600 }}>
                          {option.votes || 0} votes ({percentage}%)
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Post Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{ 
                display: 'flex', 
                gap: '16px', 
                paddingTop: '24px', 
                borderTop: '2px solid rgba(0,0,0,0.05)' 
              }}
            >
              <motion.button
                whileHover={{ scale: 1.08, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  background: post.likes?.includes(user?._id) 
                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' 
                    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  color: post.likes?.includes(user?._id) ? 'white' : '#667eea',
                  boxShadow: post.likes?.includes(user?._id) 
                    ? '0 6px 20px rgba(231, 76, 60, 0.3)' 
                    : '0 4px 15px rgba(102, 126, 234, 0.2)',
                  fontSize: '15px',
                  transition: 'all 0.3s ease'
                }}
              >
                <motion.div
                  animate={post.likes?.includes(user?._id) ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <FiHeart size={20} fill={post.likes?.includes(user?._id) ? 'white' : 'none'} />
                </motion.div>
                {post.upvotes || 0}
              </motion.button>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  fontWeight: 700,
                  color: '#667eea',
                  fontSize: '15px',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
                }}
              >
                <FiMessageCircle size={20} />
                {post.comments?.length || 0}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 800, 
              marginBottom: '32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Comments ({post.comments?.length || 0})
            </h2>

            {/* Comment Form */}
            {user ? (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onSubmit={handleCommentSubmit} 
                style={{ marginBottom: '40px' }}
              >
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '18px 20px',
                    fontSize: '16px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    borderRadius: '16px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: '16px',
                    transition: 'all 0.3s ease',
                    background: 'rgba(102, 126, 234, 0.02)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'}
                />
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={!comment.trim() || submittingComment}
                  style={{
                    padding: '16px 36px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    opacity: (!comment.trim() || submittingComment) ? 0.5 : 1,
                    fontSize: '16px',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ 
                  padding: '32px', 
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)', 
                  borderRadius: '16px', 
                  textAlign: 'center', 
                  marginBottom: '40px',
                  border: '2px dashed rgba(102, 126, 234, 0.3)'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <p style={{ marginBottom: '20px', fontSize: '16px', color: '#666', fontWeight: 500 }}>
                  Join the conversation! Log in to share your thoughts.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '14px 32px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '16px',
                    boxShadow: '0 6px 25px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  Log In to Comment
                </motion.button>
              </motion.div>
            )}

            {/* Comments List */}
            {post.comments && post.comments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {post.comments.map((comment, idx) => {
                  const isCommentOwner = user && comment.user && (user._id === comment.user._id || user._id === comment.user);
                  const canDeleteComment = isCommentOwner || isAdmin;
                  
                  return (
                    <motion.div
                      key={comment._id || idx}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08, duration: 0.4 }}
                      whileHover={{ scale: 1.01, boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)' }}
                      style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.04) 100%)',
                        borderRadius: '16px',
                        position: 'relative',
                        border: '1px solid rgba(102, 126, 234, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to={`/user/${comment.user?.username || 'unknown'}`} style={{ textDecoration: 'none' }}>
                          <motion.div 
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '16px',
                              overflow: 'hidden',
                              flexShrink: 0,
                              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                              border: '2px solid white'
                            }}
                          >
                            {comment.user?.avatar ? (
                              <img src={`http://localhost:3000${comment.user.avatar}`} alt={comment.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              comment.user?.username?.[0]?.toUpperCase() || 'U'
                            )}
                          </motion.div>
                        </Link>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <Link to={`/user/${comment.user?.username || 'unknown'}`} style={{ textDecoration: 'none' }}>
                                <motion.span 
                                  whileHover={{ x: 3 }}
                                  style={{ 
                                    fontWeight: 700, 
                                    fontSize: '16px',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                  }}
                                >
                                  {comment.user?.username || 'Unknown'}
                                </motion.span>
                              </Link>
                              <span style={{ fontSize: '14px', color: '#999', marginLeft: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <FiClock size={12} />
                                {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                            {canDeleteComment && (
                              <motion.button
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteComment(comment._id)}
                                style={{
                                  background: 'rgba(231, 76, 60, 0.1)',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '8px',
                                  borderRadius: '8px',
                                  color: '#E74C3C',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <FiTrash2 size={16} />
                              </motion.button>
                            )}
                          </div>
                          <p style={{ 
                            fontSize: '16px', 
                            lineHeight: '1.7', 
                            color: '#444', 
                            whiteSpace: 'pre-wrap',
                            margin: 0
                          }}>
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                style={{ 
                  textAlign: 'center', 
                  padding: '60px 40px', 
                  color: '#999',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(102, 126, 234, 0.2)'
                }}
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{ fontSize: '72px', marginBottom: '20px' }}
                >
                  💬
                </motion.div>
                <p style={{ fontSize: '18px', fontWeight: 600, color: '#666' }}>
                  No comments yet. Be the first to share your thoughts!
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {imageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImageModalOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '40px',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              src={`http://localhost:3000${selectedImage}`}
              alt="Full size"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setImageModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: 'white',
                fontSize: '32px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 300,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
              }}
            >
              ×
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
}

export default PostDetail;
