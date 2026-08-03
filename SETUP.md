# 🚀 Smart Student Platform - Setup & Deployment Guide

## Prerequisites
- Node.js (v16+)
- MySQL Server running
- npm package manager

## Local Development Setup

### **Backend Setup**

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment**
Create/update `.env`:
```env
JWT_SECRET=your_secret_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=smartstudent
ADMIN_JWT_SECRET=admin_secret
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

3. **Start Server**
```bash
npm start
```
Server will run on `http://localhost:5000`

---

### **Frontend Setup**

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Configure Environment** 
Create `.env.local`:
```env
VITE_API_URL=http://localhost:5000
```

3. **Start Development Server**
```bash
npm run dev
```
App will run on `http://localhost:5173`

---

### **Docker (optional, for environment parity)**

Runs MySQL + backend + frontend together in containers, with live
reload on both backend and frontend - no local Node/MySQL install
needed.

1. Copy `backend/.env.example` to `backend/.env` and fill in the
   non-DB values (JWT secrets, SMTP, Cloudinary, Gemini key) - the
   DB_* values are overridden by `docker-compose.yml` for the
   containerized MySQL, so leave those as-is.
2. From the repo root:
```bash
docker compose up --build
```
Frontend: `http://localhost:5173` · Backend: `http://localhost:5000`
· MySQL (for a host tool like Workbench, not needed by the app itself):
`localhost:3307`.

---

## Database Setup

1. **Create Database**
```sql
CREATE DATABASE smartstudent;
USE smartstudent;
```

2. **Run Migrations** (Import SQL schema)
```sql
-- Users table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  subject VARCHAR(100),
  level VARCHAR(50),
  duration VARCHAR(50),
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resource Requests table
CREATE TABLE resource_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100),
  semester VARCHAR(50),
  type VARCHAR(50),
  message TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin accounts table (if using separate admin table)
CREATE TABLE admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

3. **Add Indexes for Performance**
```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_requests_status ON resource_requests(status);
CREATE INDEX idx_courses_subject ON courses(subject);
```

---

## API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/admin/login` - Admin login

### **Resources**
- `GET /api/courses` - Get all courses
- `GET /api/resources` - Get resources (requires auth)

### **Requests**
- `POST /api/requests` - Create resource request
- `GET /api/admin/requests` - Get pending requests (admin only)
- `PUT /api/admin/requests/:id/approve` - Approve request
- `PUT /api/admin/requests/:id/reject` - Reject request

---

## Testing

### **Backend Testing**
```bash
# Install test dependencies
npm install --save-dev jest

# Run tests
npm test
```

### **Frontend Testing**
```bash
# Run development server
npm run dev

# Test in browser: http://localhost:5173
```

---

## Production Deployment

### **Environment Changes**
Update `.env` for production:
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
DB_HOST=prod-db-host
JWT_SECRET=strong_random_secret_here
```

### **Build Frontend**
```bash
cd frontend
npm run build
```

### **Deploy Options**
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Database**: AWS RDS, Azure Database, managed MySQL hosting

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` in relevant folder |
| "Connection refused 5000" | Backend not running, check `npm start` |
| "CORS error" | Check `FRONTEND_URL` in `.env` matches actual URL |
| "Database connection failed" | Verify MySQL is running and credentials are correct |
| "Token expired" | Need to login again or implement refresh tokens |

---

## Security Checklist

✅ Environment variables in `.env` (not hardcoded)  
✅ CORS restricted to specific origin  
✅ Passwords hashed with bcryptjs  
✅ JWT tokens for authentication  
✅ SQL injections mitigated with prepared statements  
✅ `.gitignore` configured for sensitive files  
✅ HTTPS recommended for production  

---

## Performance Optimization

- Add database indexes (already created)
- Enable gzip compression on server
- Implement caching strategies
- Optimize image sizes
- Use CDN for static assets

---

## Maintenance

### **Regular Tasks**
- Monitor error logs
- Update dependencies: `npm update`
- Backup database regularly
- Review user feedback
- Update security patches

### **Monitoring**
- Set up error tracking (Sentry, Rollbar)
- Monitor API response times
- Track user activity
- Database performance monitoring

