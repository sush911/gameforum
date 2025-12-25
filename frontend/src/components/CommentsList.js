import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CommentForm from './CommentForm';

function CommentsList({ postId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  const fetchComments = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/api/posts/${postId}/comments`
      );
      setComments(response.data);
    } catch (err) {
      setError('couldnt load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId, refresh]);

  const deleteComment = async (commentId) => {
    if (!window.confirm('delete this comment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) {
      setError('couldnt delete comment');
    }
  };

  return (
    <div className="comments-section">
      <h4>💬 comments</h4>
      <CommentForm postId={postId} onCommentAdded={() => setRefresh(refresh + 1)} />
      {loading && <p>loading...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {!loading && comments.length === 0 && <p>no comments yet, be first!</p>}
      {!loading && comments.length > 0 && (
        <div className="comments">
          {comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <p className="comment-author">{comment.user.username}</p>
              <p className="comment-content">{comment.content}</p>
              <div className="comment-footer">
                <small>{new Date(comment.createdAt).toLocaleDateString()}</small>
                <button
                  className="btn-delete-small"
                  onClick={() => deleteComment(comment._id)}
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

export default CommentsList;
