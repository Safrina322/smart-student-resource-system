# ⚡ Quick Reference Guide

## 🚀 Starting Your Application

### Development Mode
```bash
# Terminal 1 - Backend
cd backend
npm start
# Server: http://localhost:5000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# App: http://localhost:5173
```

### Test Credentials
**Regular User:**
- Username: (register new)
- Password: (your choice)

**Admin:**
- Email: admin@example.com
- Password: (set in database)

---

## 📝 Common Tasks

### **Update API URL**
Edit `frontend/.env.local`:
```
VITE_API_URL=http://your-api-url:5000
```

### **Change Database**
Edit `backend/.env`:
```
DB_HOST=your-host
DB_USER=your-user
DB_PASSWORD=your-pass
DB_NAME=your-database
```

### **Make API Call** (New Way)
```javascript
import { apiCall, getAuthHeader } from "../utils/api.js";

// GET request
const courses = await apiCall("/api/courses");

// POST with auth
const result = await apiCall("/api/admin/requests", {
  method: "POST",
  body: JSON.stringify(data),
  headers: getAuthHeader("adminToken")
});
```

### **Old Way** (Don't use anymore)
```javascript
// ❌ NOT RECOMMENDED
fetch("http://localhost:5000/api/courses")
  .then(res => res.json())
  // ...
```

---

## 🐛 Debugging

### Check Backend Logs
```bash
# Terminal running backend - check for errors
# Look for: ✅ (success) or ❌ (errors)
```

### Check Frontend Console
```
F12 → Console tab
Look for error messages or API responses
```

### Clear Cache & Reload
```
Ctrl + Shift + Delete → Clear cache
Ctrl + F5 → Hard reload in browser
```

### Reset State
```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
// Then refresh page
```

---

## 📋 Important Files Locations

| What | Where |
|------|-------|
| API Utility | `frontend/src/utils/api.js` |
| Backend Config | `backend/.env` |
| Frontend Config | `frontend/.env.local` |
| User Routes | `backend/routes/authRoutes.js` |
| Admin Routes | `backend/routes/adminAuthRoutes.js` |
| Requests Routes | `backend/routes/requestRoutes.js` |
| Database Setup | `backend/db.js` |

---

## ✅ Feature Testing Checklist

- [ ] Can register new user
- [ ] Can login as user
- [ ] Can view courses
- [ ] Can request resource
- [ ] Can login as admin
- [ ] Can view pending requests
- [ ] Can approve request (adds to courses)
- [ ] Can reject request
- [ ] Can see new course in list after approval
- [ ] All loading states appear correctly
- [ ] All error messages are clear

---

## 🚨 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Cannot find module 'express'" | Run `npm install` in backend |
| "Port 5000 already in use" | Close other app using port 5000 |
| "Cannot GET /api/courses" | Backend not running |
| "CORS error" | Check `FRONTEND_URL` in `backend/.env` |
| "Invalid token" | Logout and login again |
| "Database connection failed" | Check MySQL is running, credentials correct |
| "Module not found api.js" | Import path should be `../utils/api.js` |
| "Blank page on load" | Check browser console for JavaScript errors |

---

## 🔒 Security Reminders

- ✅ Never commit `.env` files
- ✅ Never hardcode passwords or secrets
- ✅ Always use HTTPS in production
- ✅ Never expose error details to users
- ✅ Validate all inputs
- ✅ Use prepared statements for SQL
- ✅ Keep dependencies updated: `npm update`

---

## 📞 Quick Commands

```bash
# Install all dependencies
npm install

# Run backend
npm start

# Run frontend dev server
npm run dev

# Build frontend for prod
npm run build

# Check for outdated packages
npm outdated

# Update packages
npm update

# View installed packages
npm list

# Clear npm cache
npm cache clean --force

# Kill process on port 5000 (Windows)
netstat -ano | findstr :5000
taskkill /PID {PID} /F
```

---

## 🎯 Next Session Checklist

Before asking for more improvements:
- [ ] Read the documentation files (SETUP.md, API_DOCS.md)
- [ ] Test all features locally
- [ ] Check browser console for errors
- [ ] Review database structure
- [ ] Test with different user accounts
- [ ] Verify all API endpoints

---

## 💬 Getting Help

1. **Check the docs**: SETUP.md, API_DOCS.md, IMPROVEMENTS.md
2. **Review code comments**: Look for 🔒, ✅, 🚫, 📝 markers
3. **Check browser console**: F12 → Console tab
4. **Review server logs**: Check terminal running backend
5. **Ask specific questions**: More details = better help

---

## 🎉 You're All Set!

Your application is now:
- ✅ Professional and clean
- ✅ Well-documented  
- ✅ Secure and ready for users
- ✅ Easy to maintain and extend
- ✅ Ready for production

Enjoy building! 🚀
