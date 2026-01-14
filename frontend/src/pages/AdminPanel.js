import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUsers, FiFileText, FiDollarSign, FiClipboard, FiTrendingUp,
  FiTrash2, FiEye, FiSearch, FiDownload, FiRefreshCw,
  FiAlertCircle, FiCheckCircle, FiClock, FiActivity
} from 'react-icons/fi';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalDonations: 0,
    totalLogs: 0
  });
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [logTypeFilter, setLogTypeFilter] = useState('all');
  const [totalUsers, setTotalUsers] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [tab, postTypeFilter, logTypeFilter]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      if (tab === 'dashboard') {
        const response = await axios.get('http://localhost:3000/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats({
          totalUsers: response.data.totalUsers || 0,
          totalPosts: response.data.totalPosts || 0,
          totalDonations: response.data.totalDonations || 0,
          totalLogs: response.data.totalComments || 0
        });
      }

      if (tab === 'users') {
        const response = await axios.get('http://localhost:3000/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
          params: { search: searchQuery }
        });
        setUsers(response.data.users || []);
        setTotalUsers(response.data.totalUsers || 0);
      } else if (tab === 'posts') {
        const response = await axios.get('http://localhost:3000/api/admin/posts', {
          headers: { Authorization: `Bearer ${token}` },
          params: { 
            type: postTypeFilter,
            search: searchQuery 
          }
        });
        setPosts(response.data || []);
      } else if (tab === 'donations') {
        const response = await axios.get('http://localhost:3000/api/admin/donations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDonations(response.data || []);
      } else if (tab === 'audit') {
        const response = await axios.get('http://localhost:3000/api/admin/audit-logs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        let logs = response.data.logs || [];
        
        // Filter by type if not 'all'
        if (logTypeFilter !== 'all') {
          logs = logs.filter(log => log.actionType === logTypeFilter.toUpperCase());
        }
        
        setAuditLogs(logs);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to load data');
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt('Ban reason:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/admin/users/${userId}/ban`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Ban response:', response.data);
      alert('User banned successfully');
      await fetchData();
    } catch (err) {
      console.error('Ban error:', err);
      setError('Failed to ban user: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unban this user?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:3000/api/admin/users/${userId}/unban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Unban response:', response.data);
      alert('User unbanned successfully');
      await fetchData();
    } catch (err) {
      console.error('Unban error:', err);
      setError('Failed to unban user: ' + (err.response?.data?.msg || err.message));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  const handleSearch = () => {
    fetchData();
  };

  const getActionTypeColor = (type) => {
    const colors = {
      AUTH: { bg: '#EBF5FF', color: '#1E40AF', border: '#3B82F6' },
      POST: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' },
      COMMENT: { bg: '#EDE9FE', color: '#5B21B6', border: '#8B5CF6' },
      USER: { bg: '#D1FAE5', color: '#065F46', border: '#10B981' },
      ADMIN: { bg: '#FEE2E2', color: '#991B1B', border: '#EF4444' },
      OTHER: { bg: '#F3F4F6', color: '#374151', border: '#9CA3AF' }
    };
    return colors[type] || colors.OTHER;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)' }}>

      {/* Modern Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '45px',
                height: '45px',
                background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🛡️
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>Admin Dashboard</div>
                <div style={{ fontSize: '12px', color: '#666' }}>GameForum Management</div>
              </div>
            </Link>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/" style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}>
                <FiActivity size={18} />
                Home
              </Link>
              <button onClick={handleLogout} style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Navigation Tabs */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '8px',
          marginBottom: '32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'dashboard', icon: <FiTrendingUp />, label: 'Dashboard' },
            { id: 'posts', icon: <FiFileText />, label: 'Posts' },
            { id: 'users', icon: <FiUsers />, label: 'Users' },
            { id: 'donations', icon: <FiDollarSign />, label: 'Donations' },
            { id: 'audit', icon: <FiClipboard />, label: 'Audit Logs' }
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                minWidth: '140px',
                padding: '14px 20px',
                background: tab === id ? 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)' : 'transparent',
                color: tab === id ? 'white' : '#666',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s',
                boxShadow: tab === id ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none'
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{
            padding: '16px 20px',
            background: '#FEE2E2',
            border: '2px solid #EF4444',
            borderRadius: '12px',
            color: '#991B1B',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: 500
          }}>
            <FiAlertCircle size={20} />
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #0079D3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '20px', color: 'white', fontSize: '16px', fontWeight: 500 }}>Loading data...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Dashboard Tab */}
            {tab === 'dashboard' && (
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '24px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                  📊 Overview Statistics
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                  {[
                    { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
                    { icon: '📝', label: 'Total Posts', value: stats.totalPosts, color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
                    { icon: '💰', label: 'Total Donations', value: `$${stats.totalDonations}`, color: '#10B981', gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
                    { icon: '📋', label: 'Audit Logs', value: stats.totalLogs, color: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }
                  ].map((stat, idx) => (
                    <div key={idx} style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '28px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'transform 0.3s, box-shadow 0.3s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div style={{
                          width: '56px',
                          height: '56px',
                          background: stat.gradient,
                          borderRadius: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          boxShadow: `0 4px 12px ${stat.color}40`
                        }}>
                          {stat.icon}
                        </div>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666', fontWeight: 500, marginBottom: '8px' }}>{stat.label}</div>
                      <div style={{ fontSize: '32px', fontWeight: 700, color: '#1a1a1a' }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Tab */}
            {tab === 'posts' && (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '24px', borderBottom: '2px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FiFileText size={28} />
                      All Posts ({posts.length})
                    </h2>
                    <button onClick={fetchData} style={{
                      padding: '10px 16px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontWeight: 600,
                      color: '#374151'
                    }}>
                      <FiRefreshCw size={16} />
                      Refresh
                    </button>
                  </div>
                  
                  {/* Filters */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['all', 'text', 'blog', 'image', 'video', 'poll'].map(type => (
                      <button
                        key={type}
                        onClick={() => setPostTypeFilter(type)}
                        style={{
                          padding: '8px 16px',
                          background: postTypeFilter === type ? 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)' : '#f3f4f6',
                          color: postTypeFilter === type ? 'white' : '#374151',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 0.2s'
                        }}
                      >
                        {type === 'all' ? '📋 All' : type === 'text' ? '📝 Text' : type === 'blog' ? '📰 Blog' : type === 'image' ? '🖼️ Image' : type === 'video' ? '🎥 Video' : '📊 Poll'}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button onClick={handleSearch} style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiSearch size={16} />
                      Search
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Type', 'Title', 'Author', 'Likes', 'Comments', 'Date', 'Actions'].map(header => (
                          <th key={header} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map(post => (
                        <tr key={post._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '6px 12px',
                              background: post.type === 'poll' ? '#9B59B6' : post.type === 'blog' ? '#16A085' : post.type === 'video' ? '#E74C3C' : post.type === 'image' ? '#3498DB' : '#2ECC71',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {post.type || 'text'}
                            </span>
                          </td>
                          <td style={{ padding: '16px', maxWidth: '300px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px', color: '#1a1a1a' }}>{post.title}</div>
                            <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {post.content || (post.type === 'video' ? '📹 Video post' : post.type === 'image' ? `🖼️ ${post.images?.length || 0} image(s)` : post.type === 'poll' ? '📊 Poll' : 'No content')}
                            </div>
                          </td>
                          <td style={{ padding: '16px', fontWeight: 500 }}>{post.user?.username || 'Unknown'}</td>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#10B981' }}>{post.upvotes || 0}</td>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#3B82F6' }}>{post.commentCount || 0}</td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Link to={`/post/${post._id}`} style={{
                                padding: '8px 14px',
                                background: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <FiEye size={14} />
                                View
                              </Link>
                              <button onClick={() => handleDeletePost(post._id)} style={{
                                padding: '8px 14px',
                                background: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <FiTrash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {posts.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                      <FiFileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>No posts found</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {tab === 'users' && (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '24px', borderBottom: '2px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiUsers size={28} />
                    All Users ({totalUsers})
                  </h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Search by username or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      style={{
                        padding: '12px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        width: '300px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    <button onClick={handleSearch} style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FiSearch size={16} />
                      Search
                    </button>
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Username', 'Email', 'Role', 'Joined', 'Actions'].map(header => (
                          <th key={header} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '16px', fontWeight: 600, color: '#1a1a1a' }}>{user.username}</td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>{user.email}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '6px 12px',
                              background: user.role === 'Admin' ? '#EF4444' : user.role === 'Moderator' ? '#F59E0B' : '#10B981',
                              color: 'white',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {user.role}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '16px' }}>
                            {user.role !== 'Admin' && (
                              user.isBanned ? (
                                <button onClick={() => handleUnbanUser(user._id)} style={{
                                  padding: '8px 14px',
                                  background: '#10B981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}>
                                  Unban User
                                </button>
                              ) : (
                                <button onClick={() => handleBanUser(user._id)} style={{
                                  padding: '8px 14px',
                                  background: '#EF4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 600
                                }}>
                                  Ban User
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                      <FiUsers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>No users found</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Donations Tab */}
            {tab === 'donations' && (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '24px', borderBottom: '2px solid #f3f4f6' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiDollarSign size={28} />
                    💰 Donations
                  </h2>
                  {donations.length > 0 && (
                    <div style={{ padding: '24px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '12px', marginBottom: '20px', color: 'white' }}>
                      <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>Total Donations</div>
                      <div style={{ fontSize: '42px', fontWeight: 700 }}>
                        ${donations.reduce((sum, d) => sum + (d.amount || 0), 0).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.9 }}>
                        From {donations.length} donation{donations.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['User', 'Amount', 'Status', 'Transaction ID', 'Date'].map(header => (
                          <th key={header} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map(donation => (
                        <tr key={donation._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{donation.user?.username || 'Unknown'}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{donation.user?.email}</div>
                          </td>
                          <td style={{ padding: '16px', fontWeight: 700, fontSize: '18px', color: '#10B981' }}>
                            ${(donation.amount || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '6px 12px',
                              background: donation.status === 'completed' ? '#D1FAE5' : donation.status === 'pending' ? '#FEF3C7' : '#FEE2E2',
                              color: donation.status === 'completed' ? '#065F46' : donation.status === 'pending' ? '#92400E' : '#991B1B',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: 'fit-content'
                            }}>
                              {donation.status === 'completed' ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                              {donation.status || 'unknown'}
                            </span>
                          </td>
                          <td style={{ padding: '16px', fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>
                            {donation.squarePaymentId ? donation.squarePaymentId.substring(0, 20) + '...' : 'N/A'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                            {new Date(donation.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {donations.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                      <FiDollarSign size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>No donations yet</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audit Logs Tab - Enhanced */}
            {tab === 'audit' && (
              <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <div style={{ padding: '24px', borderBottom: '2px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FiClipboard size={28} />
                      📋 Audit Logs ({auditLogs.length})
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={fetchData} style={{
                        padding: '10px 16px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        color: '#374151'
                      }}>
                        <FiRefreshCw size={16} />
                        Refresh
                      </button>
                      <button style={{
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600
                      }}>
                        <FiDownload size={16} />
                        Export
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                    Track all user activities including logins, logouts, posts, comments, and admin actions
                  </p>
                  
                  {/* Filter by Action Type */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['all', 'auth', 'post', 'comment', 'user', 'admin'].map(type => {
                      const colors = getActionTypeColor(type.toUpperCase());
                      return (
                        <button
                          key={type}
                          onClick={() => setLogTypeFilter(type)}
                          style={{
                            padding: '8px 16px',
                            background: logTypeFilter === type ? colors.bg : '#f3f4f6',
                            color: logTypeFilter === type ? colors.color : '#374151',
                            border: logTypeFilter === type ? `2px solid ${colors.border}` : '2px solid transparent',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'all 0.2s'
                          }}
                        >
                          {type === 'all' ? '📋 All Logs' : type === 'auth' ? '🔐 Auth' : type === 'post' ? '📝 Posts' : type === 'comment' ? '💬 Comments' : type === 'user' ? '👤 User' : '🛡️ Admin'}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['User', 'Action', 'Type', 'IP Address', 'Status', 'Date & Time'].map(header => (
                          <th key={header} style={{ padding: '16px', textAlign: 'left', fontSize: '13px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => {
                        const typeColors = getActionTypeColor(log.actionType);
                        return (
                          <tr key={log._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{log.username || 'Unknown'}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', marginTop: '2px' }}>
                                {log.user?._id?.substring(0, 8)}...
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#1a1a1a', marginBottom: '4px' }}>{log.action}</div>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                  {log.metadata.email && `📧 ${log.metadata.email.substring(0, 20)}...`}
                                  {log.metadata.title && `📄 ${log.metadata.title.substring(0, 30)}...`}
                                  {log.metadata.postId && `🔗 Post ID: ${log.metadata.postId.substring(0, 8)}...`}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{
                                padding: '6px 12px',
                                background: typeColors.bg,
                                color: typeColors.color,
                                border: `2px solid ${typeColors.border}`,
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                display: 'inline-block'
                              }}>
                                {log.actionType || 'OTHER'}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontSize: '12px', fontFamily: 'monospace', color: '#666' }}>
                              {log.ipAddress || 'N/A'}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <span style={{
                                padding: '6px 12px',
                                background: log.status === 'SUCCESS' ? '#D1FAE5' : '#FEE2E2',
                                color: log.status === 'SUCCESS' ? '#065F46' : '#991B1B',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                width: 'fit-content'
                              }}>
                                {log.status === 'SUCCESS' ? <FiCheckCircle size={12} /> : <FiAlertCircle size={12} />}
                                {log.status || 'SUCCESS'}
                              </span>
                            </td>
                            <td style={{ padding: '16px', fontSize: '13px', color: '#666' }}>
                              <div style={{ fontWeight: 500 }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {auditLogs.length === 0 && (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                      <FiClipboard size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <div style={{ fontSize: '16px', fontWeight: 500 }}>No audit logs found</div>
                      <div style={{ fontSize: '13px', marginTop: '8px' }}>Try changing the filter or refresh the page</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
