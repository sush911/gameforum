# 🎮 Game Forum

secure gaming forum with advanced security stuff, built with react & node

## 🚀 Quick Start

### needs
- Node.js v14+
- MongoDB
- npm

### install

```bash
cd gameforum

# backend
cd backend && npm install
cp .env.example .env
# edit .env with ur settings

# frontend
cd frontend && npm install

# start
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm start
```

go to http://localhost:3000

## 🔐 Security Features

### auth stuff
- **MFA** - 2FA with google authenticator
- **RBAC** - user, moderator, admin roles
- **JWT** - secure tokens (24h expiry)
- **brute force protection** - locks after 5 tries
- **rate limiting** - prevents spam attacks

### password security
- min 8 chars (upper, lower, number, special)
- real-time strength meter
- expire after 90 days
- bcrypt hashing (salt: 12)
- can't reuse last 5 passwords
- secure reset via email

### data protection
- HTTPS/TLS encryption
- helmet.js security headers
- input validation on everything
- XSS prevention
- CSRF protection

### session management
- HTTP-only cookies
- 24h timeout
- session tokens
- logout clears data

### audit logs
- track all user actions
- timestamps & IPs
- login/password changes
- admin actions
- user activity dashboard

## 🛠 Tech Stack

### Backend
- Express.js
- MongoDB (Mongoose)
- JWT (jsonwebtoken)
- bcrypt (password hashing)
- speakeasy (MFA/TOTP)
- helmet (security headers)
- rate-limit

### Frontend
- React 18
- React Router v6
- Axios
- CSS3 (dark theme)

## 📁 Project Structure

```
gameforum/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Comment.js
│   │   ├── Payment.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── role.js
│   │   └── loginlimiter.js
│   └── utils/
│       └── security.js
└── frontend/
    ├── public/
    └── src/
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Dashboard.js
        │   ├── UserProfile.js
        │   ├── PasswordReset.js
        │   └── AdminPanel.js
        ├── components/
        │   ├── CreatePost.js
        │   ├── PostList.js
        │   ├── CommentForm.js
        │   ├── CommentsList.js
        │   ├── PasswordStrengthMeter.js
        │   └── MFASetup.js
        └── App.js
```

## 🔑 API Endpoints

### Auth
- `POST /api/users/register` - sign up
- `POST /api/users/login` - sign in
- `POST /api/users/mfa/setup` - setup 2FA
- `POST /api/users/mfa/enable` - enable 2FA
- `POST /api/users/mfa/verify` - verify 2FA code

### User
- `GET /api/users/profile` - get profile
- `PUT /api/users/profile` - edit profile
- `POST /api/users/password/change` - change password
- `POST /api/users/password/reset-request` - request reset
- `POST /api/users/password/reset` - reset password

### Posts
- `POST /api/posts` - create post
- `GET /api/posts` - get all posts
- `GET /api/posts/:id` - get one post
- `PUT /api/posts/:id` - edit post
- `DELETE /api/posts/:id` - delete post

### Comments
- `POST /api/comments` - create comment
- `GET /api/posts/:id/comments` - get comments
- `DELETE /api/comments/:id` - delete comment

### Admin
- `GET /api/admin/users` - list all users
- `GET /api/admin/audit-logs` - view activity logs
- `POST /api/admin/users/:id/lock` - lock user account

## 🎯 Features

✅ User registration & login
✅ Multi-factor authentication
✅ User profiles with customization
✅ Create & manage posts
✅ Comments on posts
✅ Real-time password strength indicator
✅ Secure password reset
✅ Admin dashboard
✅ Activity logging
✅ Role-based access control
✅ Responsive design
✅ Dark theme UI

## 🛡 Security Best Practices

- strong password requirements
- account lockout after failed attempts
- rate limiting on all endpoints
- input validation & sanitization
- bcrypt password hashing
- JWT token-based auth
- audit logging for all actions
- RBAC implementation
- MFA support
- secure password reset flow

## 📊 Database Models

### User
```
username, email, password, role
mfa_enabled, mfa_secret, mfa_backup_codes
passwordHistory, passwordExpiresAt
failedLoginAttempts, lockUntil
bio, avatar, profilePrivate
createdAt, updatedAt
```

### Post
```
user, title, content
viewCount, published
createdAt, updatedAt
```

### Comment
```
user, post, content
createdAt, updatedAt
```

### AuditLog
```
user, action, metadata
timestamp
```

## 🚀 Deployment

for production:
1. set NODE_ENV=production
2. configure real database
3. use strong JWT_SECRET
4. enable HTTPS
5. set proper CORS origins
6. configure email service
7. use env vars for all secrets
8. enable security headers
9. set rate limits appropriately

## 📝 Security Documentation

see [SECURITY.md](./SECURITY.md) for detailed security info

## 📄 License

MIT

---

**made with ❤️ for gaming community**
