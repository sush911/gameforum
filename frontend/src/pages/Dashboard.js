import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CreatePost from '../components/CreatePost';
import PostList from '../components/PostList';

function Dashboard({ handleLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshPosts, setRefreshPosts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:3000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const logout = () => {
    handleLogout();
    navigate('/login');
  };

  const handlePostCreated = () => {
    setRefreshPosts(refreshPosts + 1);
  };

  if (loading) return <div className="dashboard">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.username}!</h1>
        <button className="btn-logout" onClick={logout}>
          Logout
        </button>
      </div>
      <div className="dashboard-content">
        <CreatePost onPostCreated={handlePostCreated} />
        <PostList key={refreshPosts} />
      </div>
    </div>
  );
}

export default Dashboard;
