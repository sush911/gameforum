import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/posts');
      setPosts(response.data);
    } catch (err) {
      setError('failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const deletePost = async (postId) => {
    if (!window.confirm('delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) {
      setError('failed to delete post');
    }
  };

  if (loading) return <div className="posts-list">loading posts...</div>;
  if (error) return <div className="error">{error}</div>;

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
              <p className="post-author">by {post.author.username}</p>
              <p className="post-content">{post.content}</p>
              <div className="post-footer">
                <small>{new Date(post.createdAt).toLocaleDateString()}</small>
                <button
                  className="btn-delete"
                  onClick={() => deletePost(post._id)}
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostList;
