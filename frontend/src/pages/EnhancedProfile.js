import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function EnhancedProfile() {
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:3000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user || response.data;
      setUser(userData);
      setBio(userData.bio || '');
      setLoading(false);
    } catch (err) {
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleUpdateBio = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:3000/api/users/profile',
        { bio },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = response.data.user;
      setUser(updatedUser);
      setBio(updatedUser.bio || '');
      
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchUserProfile();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await axios.post(
        'http://localhost:3000/api/users/avatar/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUser({ ...user, avatar: response.data.avatar });
      setSuccess('Profile picture updated!');
      setAvatarFile(null);
      setAvatarPreview(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white',
            borderRadius: '50%',
            margin: '0 auto 20px',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ fontSize: '18px', fontWeight: 600 }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .profile-card {
          animation: fadeIn 0.6s ease-out;
        }
        .stat-card {
          animation: slideIn 0.6s ease-out;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .avatar-container {
          position: relative;
          transition: transform 0.3s;
        }
        .avatar-container:hover {
          transform: scale(1.05);
        }
        .btn-animated {
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .btn-animated:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }
        .btn-animated:hover:before {
          width: 300px;
          height: 300px;
        }
        .btn-animated:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .tab-btn {
          transition: all 0.3s;
          position: relative;
        }
        .tab-btn:after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, #0079D3, #0056A3);
          transform: translateX(-50%);
          transition: width 0.3s;
        }
        .tab-btn.active:after {
          width: 100%;
        }
      `}</style>

      {/* Header with Gradient */}
      <header style={{
        background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
        padding: '20px 0',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            fontSize: '28px',
            fontWeight: 700,
            color: 'white',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>🎮</span>
            <span>GameForum</span>
          </Link>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/" className="btn-animated" style={{
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block'
            }}>
              🏠 Home
            </Link>
            {user?.role === 'Admin' && (
              <Link to="/admin" className="btn-animated" style={{
                padding: '10px 24px',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block'
              }}>
                🛡️ Admin
              </Link>
            )}
            <button onClick={handleLogout} className="btn-animated" style={{
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        minHeight: 'calc(100vh - 80px)',
        background: 'linear-gradient(135deg, #0079D3 0%, #0056A3 100%)',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Alerts */}
          {error && (
            <div style={{
              padding: '16px 24px',
              background: 'rgba(231, 76, 60, 0.9)',
              color: 'white',
              borderRadius: '12px',
              marginBottom: '24px',
              animation: 'fadeIn 0.3s',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
            }}>
              ❌ {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '16px 24px',
              background: 'rgba(46, 204, 113, 0.9)',
              color: 'white',
              borderRadius: '12px',
              marginBottom: '24px',
              animation: 'fadeIn 0.3s',
              boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)'
            }}>
              ✅ {success}
            </div>
          )}

          {/* Profile Header Card */}
          <div className="profile-card" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div className="avatar-container">
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0079D3, #0056A3)',
                  padding: '5px',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : user?.avatar ? (
                      <img src={`http://localhost:3000${user.avatar}`} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '60px', fontWeight: 700, color: '#0079D3' }}>
                        {user?.username?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <label style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #0079D3, #0056A3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  transition: 'transform 0.3s'
                }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  <span style={{ fontSize: '20px' }}>📷</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  background: 'linear-gradient(135deg, #0079D3, #0056A3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {user?.username}
                </h1>
                <p style={{ color: '#666', fontSize: '16px', marginBottom: '16px' }}>
                  ✉️ {user?.email}
                </p>
                {user?.role && user.role !== 'User' && (
                  <span style={{
                    display: 'inline-block',
                    padding: '8px 20px',
                    background: user.role === 'Admin' ? 'linear-gradient(135deg, #E74C3C, #C0392B)' : 'linear-gradient(135deg, #F39C12, #E67E22)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(231, 76, 60, 0.3)',
                    marginBottom: '16px'
                  }}>
                    {user.role === 'Admin' ? '👑' : '⭐'} {user.role}
                  </span>
                )}
                {avatarFile && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploading}
                      className="btn-animated"
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #0079D3, #0056A3)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '24px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.7 : 1
                      }}
                    >
                      {uploading ? '⏳ Uploading...' : '✓ Upload Photo'}
                    </button>
                    <button
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="btn-animated"
                      style={{
                        padding: '12px 24px',
                        background: '#e0e0e0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '24px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginTop: '32px'
            }}>
              <div className="stat-card" style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #0079D3, #0056A3)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
                  {user?.postCount || 0}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>📝 Posts</div>
              </div>
              <div className="stat-card" style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #3498db, #2980b9)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
                  {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>🎂 Joined</div>
              </div>
              <div className="stat-card" style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #2ecc71, #27ae60)',
                borderRadius: '16px',
                color: 'white',
                boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today'}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>🕐 Last Login</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            animation: 'fadeIn 0.6s 0.2s both'
          }}>
            <div style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '32px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => setActiveTab('profile')}
                className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                style={{
                  padding: '12px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: activeTab === 'profile' ? '#0079D3' : '#666',
                  cursor: 'pointer'
                }}
              >
                👤 Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                style={{
                  padding: '12px 24px',
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: activeTab === 'security' ? '#0079D3' : '#666',
                  cursor: 'pointer'
                }}
              >
                🔒 Security
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleUpdateBio} style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#333'
                  }}>
                    📝 Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows="6"
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      transition: 'border-color 0.3s',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0079D3'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    maxLength="500"
                  />
                  <small style={{ color: '#666', fontSize: '13px' }}>
                    {bio.length}/500 characters
                  </small>
                </div>

                <button type="submit" className="btn-animated" style={{
                  padding: '14px 32px',
                  background: 'linear-gradient(135deg, #0079D3, #0056A3)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}>
                  💾 Save Changes
                </button>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                  borderRadius: '12px',
                  marginBottom: '24px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#333' }}>
                    🔐 Two-Factor Authentication
                  </h3>
                  <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn-animated" style={{
                    padding: '12px 24px',
                    background: user?.mfa_enabled ? 'linear-gradient(135deg, #e74c3c, #c0392b)' : 'linear-gradient(135deg, #2ecc71, #27ae60)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}>
                    {user?.mfa_enabled ? '🔓 Disable 2FA' : '🔒 Enable 2FA'}
                  </button>
                </div>

                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1))',
                  borderRadius: '12px'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px', color: '#333' }}>
                    🔑 Password
                  </h3>
                  <p style={{ color: '#666', marginBottom: '16px', fontSize: '14px' }}>
                    Change your password regularly to keep your account secure
                  </p>
                  <Link to="/settings" className="btn-animated" style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3498db, #2980b9)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}>
                    🔄 Change Password
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EnhancedProfile;
