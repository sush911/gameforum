import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import CreatePost from '../components/CreatePost';
import PostList from '../components/PostList';

function Dashboard({ handleLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshPosts, setRefreshPosts] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const response = await axios.get('http://localhost:3000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setLoading(false);
      } catch (err) {
        setError('failed to load user');
        localStorage.removeItem('token');
        navigate('/login');
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

  if (loading) {
    return <div className="dashboard"><div className="loading" role="status" aria-live="polite">loading...</div></div>;
  }

  if (!user) {
    return <div className="dashboard"><div className="error" role="alert">couldn't load ur profile</div></div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header" role="banner">
        <div className="header-content">
          <h1>yo {user?.username || 'player'}! 🎮</h1>
          <p className="welcome-subtitle">welcome to ur gaming forum</p>
        </div>
        <nav className="header-nav" role="navigation" aria-label="Main navigation">
          <Link to="/profile" className="nav-link" aria-label="Go to profile page">profile</Link>
          <button onClick={logout} className="btn-logout" aria-label="Log out of account">logout</button>
        </nav>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <main id="main-content" className="dashboard-main" role="main">
        <aside className="sidebar" aria-label="User information">
          <div className="user-card">
            <div className="avatar" role="img" aria-label={`${user?.username || 'user'} avatar`}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.username || 'user'} />
              ) : (
                <div className="avatar-default">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
              )}
            </div>
            <h3>{user?.username || 'user'}</h3>
            <p className="user-email">{user?.email || ''}</p>
            <p className="user-role">role: {user?.role || 'User'}</p>
            {user?.isPremium && <span className="badge premium" role="status">⭐ premium</span>}
            <Link to="/profile" className="btn btn-secondary" aria-label="Edit your profile">edit profile</Link>
          </div>
        </aside>

        <section className="feed" aria-label="Posts feed">
          <CreatePost onPostCreated={handlePostCreated} />
          <PostList key={refreshPosts} />
        </section>
      </main>
    </div>
  );
}

export default Dashboard;








