# 📡 Smart Student API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in header:
```
Authorization: Bearer {token}
```

---

## Endpoints

### **Authentication Endpoints**

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "message": "User registered successfully"
}

Errors:
- 400: Missing required fields
- 500: Database error
```

#### User Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "SecurePass123"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "user"
  }
}

Errors:
- 401: Invalid credentials
- 500: Server error
```

#### Admin Login
```http
POST /admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "AdminPass123"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}

Errors:
- 401: Invalid credentials
- 500: Server error
```

---

### **Course Endpoints**

#### Get All Courses
```http
GET /courses
Content-Type: application/json

Response 200:
[
  {
    "id": 1,
    "title": "Web Development Basics",
    "description": "Learn HTML, CSS, JavaScript",
    "subject": "Web Development",
    "level": "Beginner",
    "duration": "4 weeks",
    "image": "web-dev.jpg",
    "created_at": "2026-03-01T10:00:00Z"
  },
  ...
]

Errors:
- 500: Database error
```

---

### **Resource Request Endpoints**

#### Create Resource Request
```http
POST /requests
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Advanced Python Programming",
  "subject": "Programming",
  "semester": "2",
  "type": "PDF",
  "message": "Would love to have this advanced course"
}

Response 200:
{
  "message": "Request submitted successfully"
}

Errors:
- 400: Missing fields or duplicate request
- 500: Server error
```

#### Get Pending Requests (Admin Only)
```http
GET /admin/requests
Authorization: Bearer {adminToken}

Response 200:
[
  {
    "id": 5,
    "title": "Machine Learning Course",
    "subject": "AI",
    "semester": "4",
    "type": "Video",
    "message": "Would be very helpful",
    "status": "pending",
    "created_at": "2026-03-15T14:30:00Z"
  },
  ...
]

Errors:
- 401: Unauthorized
- 500: Database error
```

#### Approve Request (Admin Only)
```http
PUT /admin/requests/:id/approve
Authorization: Bearer {adminToken}

Response 200:
{
  "message": "Request approved and added to courses"
}

Errors:
- 401: Unauthorized
- 404: Request not found
- 500: Database error
```

#### Reject Request (Admin Only)
```http
PUT /admin/requests/:id/reject
Authorization: Bearer {adminToken}

Response 200:
{
  "message": "Request rejected"
}

Errors:
- 401: Unauthorized
- 404: Request not found
- 500: Database error
```

---

### **Admin Course Endpoints**

#### Add Course (Admin Only)
```http
POST /admin/courses/add
Content-Type: multipart/form-data
Authorization: Bearer {adminToken}

Form Data:
- title: "Data Science 101"
- description: "Introduction to data science"
- subject: "Data Science"
- level: "Beginner"
- duration: "6 weeks"
- image: (file)

Response 200:
{
  "message": "Course added successfully"
}

Errors:
- 400: Missing required fields
- 401: Unauthorized
- 500: Server error
```

---

## Error Handling

All errors follow this format:
```json
{
  "message": "Error description",
  "status": 400
}
```

### Common HTTP Status Codes
- **200**: Success
- **400**: Bad Request (missing/invalid data)
- **401**: Unauthorized (no valid token)
- **404**: Not Found
- **500**: Server Error

---

## Response Examples

### Success Response
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "message": "Validation failed",
  "details": "Email must be valid"
}
```

---

## Rate Limiting
Currently not implemented. Recommended for production:
- Login attempts: 5 per minute
- API calls: 100 per hour per user
- File uploads: 5 per minute

---

## Pagination (Coming Soon)
```http
GET /courses?page=1&limit=10
```

---

## Filtering (Coming Soon)
```http
GET /courses?subject=Programming&level=Beginner
```

---

## File Upload Requirements
- Max size: 5MB
- Allowed formats: jpg, png, gif, pdf
- Path: `/images/` (backend folder)

---

## Token Expiration
- User tokens: 1 hour
- Admin tokens: 24 hours
- Implement refresh tokens for better UX

---

## Frontend Integration

Use the centralized API utility:
```javascript
import { apiCall, getAuthHeader } from "./utils/api.js";

// Without auth
const courses = await apiCall("/courses");

// With auth
const requests = await apiCall("/admin/requests", {
  headers: getAuthHeader("adminToken")
});
```

