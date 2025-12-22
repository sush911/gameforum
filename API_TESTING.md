# API Testing Quick Reference

## Setup

1. Start MongoDB (if local)
2. Set environment variables in `.env`
3. Run `npm start`
4. API will be at `http://localhost:3000`

## Test Accounts

Create these for testing:

```bash
# Admin account (manually create in DB with role: 'Admin')
email: admin@gameforum.com
password: AdminPass123!

# Regular user
email: user1@gameforum.com
password: UserPass123!

# Premium user
email: premium@gameforum.com
password: PremiumPass123!
```

---

## Complete Test Flow

### 1. Register New User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "testplayer@gameforum.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

Expected: `201 Created` with user data

---

### 2. Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testplayer@gameforum.com",
    "password": "TestPass123!"
  }'
```

Expected: `200 OK` with JWT token

**Save the token as `$TOKEN`:**
```bash
TOKEN="your_jwt_token_here"
```

---

### 3. View Your Profile
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

Expected: User profile without password

---

### 4. Update Profile
```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Hardcore gamer | PC gaming enthusiast",
    "profilePrivate": false
  }'
```

Expected: `200 OK` with updated profile

---

### 5. Setup MFA

**Step 1: Initialize MFA Setup**
```bash
curl -X POST http://localhost:3000/api/users/mfa/setup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

Response contains:
- `secret`: Raw secret to scan with authenticator
- `qrCode`: QR code image (base64)
- `backupCodes`: Emergency codes

**Step 2: Enable MFA**
- Scan the QR code with Google Authenticator / Authy
- Get the 6-digit code
- Enable MFA:

```bash
curl -X POST http://localhost:3000/api/users/mfa/enable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "JBSWY3DPEBLW64TMMQ======",
    "token": "123456",
    "backupCodes": ["XXXXXXXX", "YYYYYYYY", ...]
  }'
```

Expected: `200 OK` - MFA enabled

**Step 3: Test MFA Login**
- Logout (use new token)
- Try to login again
- Should get `requireMFA: true` response
- Verify with your authenticator code

---

### 6. Change Password
```bash
curl -X POST http://localhost:3000/api/users/password/change \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "TestPass123!",
    "newPassword": "NewPass456!",
    "confirmPassword": "NewPass456!"
  }'
```

Expected: `200 OK` - Password changed

---

### 7. Create a Post
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best Gaming Mouse 2024",
    "content": "After 6 months of testing, here are the best gaming mice I found. The Logitech G Pro X2 is my top pick because..."
  }'
```

Expected: `201 Created` with post data

Save the `_id` as `$POST_ID`

---

### 8. View All Posts
```bash
curl -X GET http://localhost:3000/api/posts \
  -H "Content-Type: application/json"
```

Expected: Array of all published posts

---

### 9. Get Specific Post
```bash
curl -X GET http://localhost:3000/api/posts/$POST_ID \
  -H "Content-Type: application/json"
```

Expected: Single post (with incremented viewCount)

---

### 10. Update Your Post
```bash
curl -X PUT http://localhost:3000/api/posts/$POST_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Best Gaming Mouse 2024 - Updated",
    "content": "Updated content here..."
  }'
```

Expected: `200 OK` - Post updated

---

### 11. Create Comment
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "'$POST_ID'",
    "content": "Great review! I use this mouse and it's amazing."
  }'
```

Expected: `201 Created` with comment data

---

### 12. View Comments on Post
```bash
curl -X GET http://localhost:3000/api/posts/$POST_ID/comments \
  -H "Content-Type: application/json"
```

Expected: Array of comments on that post

---

### 13. Process Payment (Square Sandbox)
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "sourceId": "cnon:card-nonce-ok"
  }'
```

**Square Sandbox Test Cards:**
- Success: `4111111111111111`
- Declined: `4000002500003155`

Expected: `200 OK` - Payment processed (user becomes premium)

---

### 14. Admin: View Audit Logs (Admin Token Only)
```bash
curl -X GET http://localhost:3000/api/admin/audit-logs \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected: All logged actions with timestamps

---

### 15. Admin: Lock User Account
```bash
curl -X POST http://localhost:3000/api/admin/users/$USER_ID/lock \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

Expected: User account locked for 7 days

---

## Security Testing Scenarios

### Test 1: Brute Force Protection
```bash
# Try logging in with wrong password 6 times
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testplayer@gameforum.com",
      "password": "WrongPassword'$i'"
    }'
  echo "Attempt $i"
done
# 6th attempt should be rate limited
```

### Test 2: Weak Password Rejection
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "weakuser",
    "email": "weak@gameforum.com",
    "password": "weak123",
    "confirmPassword": "weak123"
  }'
# Should be rejected (no uppercase, no special char)
```

### Test 3: Password Reuse Prevention
```bash
# After changing password to "NewPass456!", try changing to old one
curl -X POST http://localhost:3000/api/users/password/change \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "NewPass456!",
    "newPassword": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
# Should be rejected (recent reuse)
```

### Test 4: Unauthorized Access
```bash
# Try to delete someone else's post
curl -X DELETE http://localhost:3000/api/posts/$OTHER_USER_POST_ID \
  -H "Authorization: Bearer $YOUR_TOKEN"
# Should get 403 Forbidden
```

### Test 5: Input Validation
```bash
# Try to create post with too short title
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "hi",
    "content": "This title is too short"
  }'
# Should be rejected (title < 5 chars)
```

---

## Useful Commands

### Get token easily:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testplayer@gameforum.com","password":"TestPass123!"}' | jq -r '.token')

echo $TOKEN
```

### Pretty print JSON response:
```bash
# Add | jq '.' to any curl command
curl ... | jq '.'
```

### Extract specific field:
```bash
curl ... | jq '.token'
curl ... | jq '.user.email'
```

---

## Common Issues & Solutions

**Issue: "No token provided"**
- Make sure you're including `Authorization: Bearer $TOKEN` header

**Issue: "User not found"**
- The user might have been deleted or the email is wrong
- Try registering a new user

**Issue: "CORS error"**
- Frontend and backend must both be running
- Check CORS configuration in server.js

**Issue: "MongoDB connection failed"**
- Make sure MongoDB is running
- Check MONGODB_URI in .env file

**Issue: "Invalid Square token"**
- Get a new sandbox token from Square Dashboard
- Update SQUARE_ACCESS_TOKEN in .env
