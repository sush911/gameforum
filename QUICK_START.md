# 🎮 Gaming Forum - Quick Start Guide

Get your backend running in 5 minutes!

---

## Step 1: Install Dependencies (1 minute)

```bash
cd c:\Users\Razor\Desktop\gameforum
npm install
```

✅ You should see: "added 32 packages"

---

## Step 2: Setup Environment Variables (1 minute)

Open `.env` file and configure:

```
MONGODB_URI=mongodb://localhost:27017/gameforum
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars_CHANGEME
SQUARE_ACCESS_TOKEN=sq_test_YOUR_SQUARE_TOKEN_HERE
PORT=3000
NODE_ENV=development
```

**Note:** For testing without MongoDB, you can use MongoDB Atlas (free cloud):
1. Create account at mongodb.com
2. Create cluster
3. Copy connection string to MONGODB_URI

---

## Step 3: Start the Server (1 minute)

```bash
npm start
```

✅ You should see:
```
🎮 Gaming Forum API running on http://localhost:3000
📝 Remember to set JWT_SECRET and SQUARE_ACCESS_TOKEN in .env
```

---

## Step 4: Test an Endpoint (2 minutes)

Open PowerShell/Terminal and test registration:

```powershell
curl -X POST http://localhost:3000/api/users/register `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!"
  }'
```

✅ You should get a `201 Created` response with the user data.

---

## Next: Follow the Testing Guide

Now you can follow **API_TESTING.md** for complete testing examples!

---

## Useful Commands

**Stop server:** `Ctrl+C`

**View logs:** Check terminal output

**Clear MongoDB data:**
```powershell
mongo
# In mongo shell:
use gameforum
db.dropDatabase()
exit
```

**Test with Postman/Insomnia:** Import endpoints from README.md

---

## Common Issues

| Issue | Solution |
|---|---|
| "Cannot find module" | Run `npm install` again |
| "Connection refused" | Check MongoDB is running, MONGODB_URI correct |
| "Invalid token" | Make sure JWT_SECRET is set in .env |
| "Port 3000 already in use" | Change PORT in .env to 3001 |

---

## File Organization

```
gameforum/
├── server.js              ← Main server
├── models/                ← Database schemas
├── middleware/            ← Auth, RBAC, rate limiting
├── utils/                 ← Security utilities
├── .env                   ← Your secrets (create)
├── package.json           ← Dependencies
├── README.md              ← Full documentation
├── API_TESTING.md         ← Test examples
└── SECURITY_TESTING.md    ← Security details
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/users/register | Create account |
| POST | /api/users/login | Login to account |
| POST | /api/users/mfa/setup | Setup 2FA |
| POST | /api/posts | Create post |
| GET | /api/posts | View all posts |
| POST | /api/comments | Create comment |
| POST | /api/payments | Process payment |

See **README.md** and **API_TESTING.md** for complete list.

---

## What's Implemented

✅ User authentication with MFA  
✅ Brute-force protection  
✅ Password requirements & expiry  
✅ Role-based access control  
✅ Activity logging  
✅ Secure payments (Square)  
✅ Post & comment system  
✅ Data encryption  
✅ Rate limiting  
✅ Input validation  

---

## Documentation Files

1. **README.md** - Complete project overview
2. **API_TESTING.md** - Step-by-step testing with examples
3. **SECURITY_TESTING.md** - Vulnerabilities and fixes
4. **VIDEO_DEMO_SCRIPT.md** - Recording guide
5. **IMPLEMENTATION_SUMMARY.md** - Feature details
6. **COURSEWORK_CHECKLIST.md** - Requirements checklist

---

Ready to test? Go to **API_TESTING.md** now! 🚀
