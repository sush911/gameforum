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
    if (!window.confirm('u sure bruh?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
      setError('');
    } catch (err) {
      setError('couldnt delete that lol');
    }
  };

  if (loading) return <div className="posts-list" role="status" aria-live="polite">loading...</div>;
  if (error) return <div className="error" role="alert" aria-live="assertive">{error}</div>;

  return (
    <div className="posts-list" role="main" aria-label="Posts feed">
      <h2 id="posts-heading">🔥 latest posts</h2>
      {posts.length === 0 ? (
        <p className="no-posts" role="status">no posts yet, start one!</p>
      ) : (
        <div className="posts" role="feed" aria-labelledby="posts-heading">
          {posts.map((post) => (
            <article key={post._id} className="post-card" aria-labelledby={`post-title-${post._id}`}>
              <h3 id={`post-title-${post._id}`}>{post.title}</h3>
              <p className="post-author" aria-label={`Posted by ${post.author?.username || post.user?.username}`}>
                by {post.author?.username || post.user?.username}
              </p>
              <p className="post-content">{post.content}</p>
              <div className="post-footer">
                <time dateTime={post.createdAt} aria-label={`Posted on ${new Date(post.createdAt).toLocaleDateString()}`}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </time>
                <div className="post-actions" role="group" aria-label="Post actions">
                  <button
                    className="btn-toggle-comments"
                    onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}
                    aria-expanded={expandedPost === post._id}
                    aria-controls={`comments-${post._id}`}
                    aria-label={expandedPost === post._id ? 'Hide comments' : 'Show comments'}
                  >
                    {expandedPost === post._id ? 'hide' : 'show'} comments
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => deletePost(post._id)}
                    aria-label={`Delete post ${post.title}`}
                  >
                    delete
                  </button>
                </div>
              </div>
              {expandedPost === post._id && (
                <div id={`comments-${post._id}`} role="region" aria-label="Comments section">
                  <CommentsList postId={post._id} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default PostList;



