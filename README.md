# 🎮 Game Forum - Secure Community Platform

A modern gaming forum with advanced security features, built with React and Node.js.

## 🔐 Security Features

### Authentication & Authorization
- **Multi-Factor Authentication (MFA)** - TOTP-based 2FA with backup codes
- **Role-Based Access Control (RBAC)** - User, Moderator, Admin roles
- **JWT Tokens** - Secure session management with 24-hour expiration
- **Brute-Force Protection** - Account lockout after 5 failed login attempts (30 minutes)
- **Rate Limiting** - Prevents automated attacks on all API endpoints

### Password Security
- **Strong Password Requirements**
  - Minimum 8 characters
  - Uppercase, lowercase, numbers, and special characters
  - Real-time strength meter during registration
  - Password expiration every 90 days
- **Password History** - Prevents reuse of last 5 passwords
- **Secure Storage** - bcrypt hashing (salt rounds: 12)
- **Password Reset** - Secure token-based password recovery

### Data Protection
- **HTTPS/TLS** - All communication encrypted
- **Helmet.js** - HTTP security headers
- **Input Validation** - Server-side validation on all inputs
- **XSS Protection** - Sanitized output rendering
- **CSRF Protection** - Token validation for state-changing requests

### Session Management
- **HTTP-Only Cookies** - Prevents JavaScript access
- **Secure Flags** - HTTPS-only transmission
- **Session Tokens** - 24-hour expiration windows
- **Session Invalidation** - Logout clears all session data

### Audit Logging
- **Comprehensive Action Logging**
  - User registration, login, logout
  - Password changes and resets
  - MFA setup and verification
  - Profile updates
  - Post/comment creation and deletion
  - Admin actions
- **Timestamp & IP Tracking** - For security incidents
- **User Activity Monitoring** - Admin dashboard access

## 🛠 Tech Stack

### Backend
- **Node.js & Express.js** - API server
- **MongoDB & Mongoose** - Database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **speakeasy & qrcode** - MFA/TOTP
- **nodemailer** - Email notifications
- **express-rate-limit** - Rate limiting
- **helmet** - Security headers

### Frontend
- **React 18** - UI framework
- **React Router v6** - Routing
- **Axios** - HTTP client
- **CSS3** - Modern styling with dark theme

## 📦 Installation

### Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gameforum
JWT_SECRET=your_super_secret_key_here
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
FRONTEND_URL=http://localhost:3000
```

Start server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🚀 Features

### User Management
- ✅ Secure registration with validation
- ✅ Email-based login
- ✅ Optional MFA setup
- ✅ Profile customization (bio, avatar, privacy settings)
- ✅ Password change with history
- ✅ Forgot password recovery

### Forum Functionality
- ✅ Create posts with title and content
- ✅ Comment on posts
- ✅ Edit/delete own posts
- ✅ Delete own comments
- ✅ View user profiles
- ✅ Private/public profile setting

### Admin Features
- ✅ Audit log viewing
- ✅ User account management
- ✅ Account lockout functionality
- ✅ System monitoring

## 🔒 Security Best Practices Implemented

1. **Input Validation** - All user inputs validated server-side
2. **SQL Injection Prevention** - Using Mongoose ORM
3. **CORS Protection** - Whitelist configured origins
4. **DDoS Mitigation** - Rate limiting per IP/user
5. **Session Hijacking Prevention** - Secure tokens with expiration
6. **OWASP Compliance** - Follows OWASP Top 10 guidelines
7. **Error Handling** - No sensitive info in error messages
8. **Dependency Management** - Regular security updates

## 📝 API Endpoints

### Authentication
- `POST /api/users/register` - New account
- `POST /api/users/login` - User login
- `POST /api/users/mfa/setup` - Setup 2FA
- `POST /api/users/mfa/enable` - Enable 2FA
- `POST /api/users/mfa/verify` - Verify 2FA token

### User
- `GET /api/users/profile` - Get profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/password/change` - Change password
- `POST /api/users/password/reset-request` - Request reset
- `POST /api/users/password/reset` - Reset password

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `POST /api/comments` - Add comment
- `GET /api/posts/:postId/comments` - Get comments
- `DELETE /api/comments/:id` - Delete comment

### Admin
- `GET /api/admin/audit-logs` - View audit logs
- `GET /api/admin/users/:id` - Get user details
- `POST /api/admin/users/:id/lock` - Lock account

## 🧪 Testing Security

### Test Account
- Email: `test@gameforum.local`
- Username: `testuser`
- Password: `TestPass123!`

### Test 2FA
1. Register account
2. Enable MFA in settings
3. Use Google Authenticator or Authy
4. Save backup codes

### Test Brute Force Protection
1. Try 5 wrong passwords
2. Account locks for 30 minutes
3. Attempts logged in audit

## 📊 Audit Log Example

```json
{
  "user": "userId",
  "action": "LOGIN",
  "metadata": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "timestamp": "2025-12-25T10:30:00Z"
}
```

## ⚠️ Known Vulnerabilities & Mitigation

### Potential Issues & Solutions

1. **JWT Expiration**
   - Issue: Long JWT token lifetime
   - Mitigation: Refresh token rotation

2. **Rate Limit Bypass**
   - Issue: Proxy requests bypass IP limits
   - Mitigation: Implement user-based rate limiting

3. **Password Reset Timing**
   - Issue: Email delivery delays
   - Mitigation: Short token expiry (1 hour)

## 📋 Compliance

- ✅ OWASP Top 10 (2021)
- ✅ GDPR-ready (user data management)
- ✅ PCI DSS ready (for payments)
- ✅ WCAG 2.1 Level AA (accessibility)

## 🔄 Development Roadmap

- [ ] Payment integration (Stripe/Square)
- [ ] Email verification
- [ ] Notification system
- [ ] Post categories/tags
- [ ] Advanced search
- [ ] User reputation system
- [ ] Content moderation tools
- [ ] Dark/light theme toggle

## 📞 Support

For security issues, please email: `security@gameforum.local`

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: December 25, 2025
**Security Status**: 🟢 Production Ready
