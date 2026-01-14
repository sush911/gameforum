import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchNotifications();
  }, [filter]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      navigate('/login');
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
        params: { unreadOnly: filter === 'unread' }
      });
      setNotifications(response.data.notifications);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:3000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:3000/api/notifications/read-all',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment': return '💬';
      case 'reply': return '↩️';
      case 'like': return '❤️';
      case 'mention': return '@';
      case 'follow': return '👤';
      default: return '🔔';
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <>
      <Navbar user={user} handleLogout={() => {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        navigate('/login');
      }} />

      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>Notifications</h1>
          
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                padding: '8px 16px',
                background: filter === 'all' ? '#0079D3' : 'transparent',
                color: filter === 'all' ? 'white' : '#1c1c1c',
                border: '1px solid #ccc',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              style={{
                padding: '8px 16px',
                background: filter === 'unread' ? '#0079D3' : 'transparent',
                color: filter === 'unread' ? 'white' : '#1c1c1c',
                border: '1px solid #ccc',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Unread
            </button>
            {notifications.some(n => !n.read) && (
              <button
                onClick={markAllAsRead}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: '#0079D3',
                  border: '1px solid #0079D3',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
            <h3 style={{ marginBottom: '8px' }}>No notifications</h3>
            <p style={{ color: '#878A8C' }}>
              {filter === 'unread' ? 'You\'re all caught up!' : 'You don\'t have any notifications yet'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {notifications.map(notification => (
              <div
                key={notification._id}
                style={{
                  background: notification.read ? 'white' : 'rgba(0, 121, 211, 0.05)',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                  position: 'relative'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#f6f7f8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0
                }}>
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {notification.sender?.avatar ? (
                      <img
                        src={`http://localhost:3000${notification.sender.avatar}`}
                        alt={notification.sender.username}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#0079D3',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {notification.sender?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <Link
                      to={`/user/${notification.sender?.username}`}
                      style={{
                        fontWeight: 700,
                        color: '#1c1c1c',
                        textDecoration: 'none'
                      }}
                    >
                      {notification.sender?.username}
                    </Link>
                    <span style={{ color: '#878A8C', fontSize: '14px' }}>
                      {notification.message}
                    </span>
                  </div>
                  
                  {notification.post && (
                    <Link
                      to={`/post/${notification.post._id}`}
                      style={{
                        display: 'block',
                        marginTop: '8px',
                        padding: '8px 12px',
                        background: '#f6f7f8',
                        borderRadius: '4px',
                        fontSize: '14px',
                        color: '#1c1c1c',
                        textDecoration: 'none'
                      }}
                    >
                      {notification.post.title}
                    </Link>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#878A8C' }}>
                    {formatDate(notification.createdAt)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        color: '#0079D3',
                        border: '1px solid #0079D3',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: '#E74C3C',
                      border: '1px solid #E74C3C',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Notifications;
