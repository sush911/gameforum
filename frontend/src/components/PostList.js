import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentsList from './CommentsList';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/posts');
      setPosts(response.data || []);
      setError('');
    } catch (err) {
      setError('failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const deletePost = async (postId) => {
    if (!window.confirm('sure?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
      setError('');
    } catch (err) {
      setError('couldnt delete');
    }
  };

  if (loading) return <div className="posts-list">loading...</div>;
  if (error) return <div className="error" role="alert">{error}</div>;

  return (
    <div className="posts-list">
      <h2>posts</h2>
      {posts.length === 0 ? (
        <p>no posts yet. be the first to post!</p>
      ) : (
        <div className="posts">
          {posts.map((post) => (
            <div key={post._id} className="post-card">
              <h3>{post.title}</h3>
              <p className="post-author">by {post.author?.username || post.user?.username}</p>
              <p className="post-content">{post.content}</p>
              <div className="post-footer">
                <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                <div className="post-actions">
                  <button
                    className="btn-toggle-comments"
                    onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                  >
                    {expandedPost === post._id ? 'hide' : 'show'} comments
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deletePost(post._id)}
                  >
                    delete
                  </button>
                </div>
              </div>
              {expandedPost === post._id && <CommentsList postId={post._id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostList;



