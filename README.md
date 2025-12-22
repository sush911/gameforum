# Gaming Forum - Secure Backend API

A feature-rich gaming forum backend with enterprise-level security features built with Node.js, Express, and MongoDB.

## 🔐 Security Features Implemented

### 1. Authentication & Authorization
- ✅ **Secure User Registration**: Email validation, strong password requirements
- ✅ **Brute-Force Protection**: Rate limiting, account lockout after 5 failed attempts (30 minutes)
- ✅ **Multi-Factor Authentication (MFA)**: TOTP-based 2FA with backup codes
- ✅ **Role-Based Access Control (RBAC)**: User, Moderator, Admin roles
- ✅ **Session Management**: Secure JWT tokens with 24-hour expiry, session tokens

### 2. Password Security
- ✅ **Password Strength Requirements**:
  - Minimum 8 characters
  - Must contain uppercase, lowercase, digit, and special character
- ✅ **Password Expiry**: Passwords expire after 90 days
- ✅ **Password Reuse Prevention**: Cannot reuse last 5 passwords
- ✅ **Password Change History**: Track last 10 password changes
- ✅ **Password Reset Functionality**: Secure token-based reset

### 3. Data Protection
- ✅ **Encryption**: Passwords hashed with bcrypt (12 rounds)
- ✅ **Data Validation**: Input sanitization and length validation
- ✅ **Secure Headers**: Helmet.js for HTTP security headers
- ✅ **HTTPS Ready**: Supports secure communication
- ✅ **CORS**: Properly configured Cross-Origin Resource Sharing

### 4. Activity Logging & Auditing
- ✅ **Comprehensive Audit Logs**: All user actions tracked with timestamps
- ✅ **Metadata Tracking**: IP addresses, payment IDs, action details stored
- ✅ **Admin Access**: Audit log review limited to administrators

### 5. Transaction Security
- ✅ **Secure Payment Processing**: Integrated with Square Payment API
- ✅ **Idempotency Keys**: Prevent duplicate transactions
- ✅ **Payment Verification**: Validate amount and source before processing
- ✅ **Premium Tier**: Automatic user upgrade on successful payment

### 6. Rate Limiting
- ✅ **Login Limiter**: 5 attempts per 15 minutes
- ✅ **Registration Limiter**: 10 registrations per hour
- ✅ **API Limiter**: 100 requests per 15 minutes on public endpoints
- ✅ **Admin Bypass**: Admins not subject to login rate limit

## 📋 API Endpoints

### Authentication
```
POST   /api/users/register              - Register new user
POST   /api/users/login                 - Login (returns JWT token)
POST   /api/users/mfa/setup             - Initialize MFA setup
POST   /api/users/mfa/enable            - Enable MFA with TOTP token
POST   /api/users/mfa/verify            - Verify MFA token during login
```

### Password Management
```
POST   /api/users/password/change       - Change password (auth required)
POST   /api/users/password/reset        - Request password reset
```

### User Profile
```
GET    /api/users/profile               - Get user profile (auth required)
PUT    /api/users/profile               - Update profile (auth required)
```

### Posts
```
POST   /api/posts                       - Create new post (auth required)
GET    /api/posts                       - Get all published posts
GET    /api/posts/:id                   - Get post by ID (increments views)
PUT    /api/posts/:id                   - Update own post (auth required)
DELETE /api/posts/:id                   - Delete own post (auth required)
```

### Comments
```
POST   /api/comments                    - Create comment (auth required)
GET    /api/posts/:postId/comments      - Get all comments for post
```

### Payments
```
POST   /api/payments                    - Process payment (auth required)
```

### Admin
```
GET    /api/admin/audit-logs            - View audit logs (admin only)
GET    /api/admin/users/:id             - Get user details (admin only)
POST   /api/admin/users/:id/lock        - Lock user account (admin only)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 14+
- MongoDB
- Square API credentials

### Installation
```bash
# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your values

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Environment Variables
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_32_character_secret_key
SQUARE_ACCESS_TOKEN=your_square_sandbox_token
PORT=3000
NODE_ENV=development
```

## 🧪 Testing MFA

1. Register an account
2. Call `/api/users/mfa/setup` to get QR code and secret
3. Scan QR code in authenticator app (Google Authenticator, Authy, etc.)
4. Call `/api/users/mfa/enable` with TOTP token
5. On next login, MFA verification required

## 📊 Database Models

### User
- Username, Email (unique)
- Password (hashed with bcrypt)
- Role (User, Moderator, Admin)
- MFA settings and backup codes
- Login attempt tracking
- Password history and expiry
- Session tokens

### Post
- Title, Content
- Author (user reference)
- Published status
- View count, Likes
- Timestamps

### Comment
- Content
- Author (user reference)
- Post reference
- Timestamps

### Payment
- User reference
- Square Payment ID
- Amount, Currency
- Status
- Timestamps

### AuditLog
- User reference
- Action type
- Metadata (IP, IDs, etc.)
- Timestamps

## 🔒 Security Best Practices Implemented

1. **Never store sensitive data in logs** - Passwords excluded from responses
2. **Use HTTPS in production** - API ready for HTTPS deployment
3. **Validate all inputs** - Length, format, type validation
4. **Rate limit authentication** - Prevent brute-force attacks
5. **Secure password hashing** - bcrypt with 12 rounds
6. **Account lockout mechanism** - Automatic lockout after failed attempts
7. **Audit trail** - Complete action history for compliance
8. **Token expiration** - JWT tokens expire after 24 hours
9. **Role-based access** - Granular permission control
10. **Admin separation** - Special handling for admin operations

## 🚨 Known Vulnerabilities & Fixes

### 1. Weak Password Hashing (FIXED)
- **Issue**: Using bcrypt rounds < 10
- **Fix**: Using 12 rounds for bcrypt hashing

### 2. No Account Lockout (FIXED)
- **Issue**: Users could be brute-forced indefinitely
- **Fix**: Auto-lockout after 5 failed attempts for 30 minutes

### 3. No Password Expiry (FIXED)
- **Issue**: Old passwords never expire
- **Fix**: Passwords expire after 90 days, users notified

### 4. No MFA (FIXED)
- **Issue**: Only password protection
- **Fix**: TOTP-based MFA with backup codes

### 5. Missing Rate Limiting (FIXED)
- **Issue**: No protection against automated attacks
- **Fix**: Rate limiters on login, register, and API endpoints

### 6. Weak Input Validation (FIXED)
- **Issue**: Minimal field validation
- **Fix**: Comprehensive length and format validation

### 7. No Activity Logging (FIXED)
- **Issue**: No audit trail for security events
- **Fix**: Complete audit logging with metadata

### 8. Insecure Session Management (FIXED)
- **Issue**: No session tracking
- **Fix**: Session tokens with expiry, secure JWT implementation

## 📝 Example Requests

### Register
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "gamerguy",
    "email": "user@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Create Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best Gaming Setup 2024",
    "content": "Here are my top gaming recommendations..."
  }'
```

## 📄 License
ISC

## 👤 Author
Your Project Name
