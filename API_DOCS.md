# LEVEL 1 API Documentation

## Authentication Endpoints

All endpoints return responses in this format:
```json
{
  "status": "success|error",
  "data": {...} or "detail": "error message"
}
```

### 1. Register User
**POST** `/api/auth/register/`

Register a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@exam.local",
  "password": "secure_password_123",
  "password_confirm": "secure_password_123",
  "role": "STUDENT"
}
```

**Roles:**
- `ADMIN` - Full system access
- `INSTRUCTOR` - Can create and manage exams
- `STUDENT` - Can take exams

**Response:** `201 Created`
```json
{
  "status": "success",
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@exam.local",
    "role": {
      "id": "...",
      "name": "STUDENT",
      "description": "..."
    },
    "role_name": "STUDENT",
    "is_active": true,
    "created_at": "2026-01-31T12:00:00Z",
    "updated_at": "2026-01-31T12:00:00Z"
  }
}
```

**Error:** `400 Bad Request`
```json
{
  "status": "error",
  "errors": {
    "username": ["Username already exists"],
    "email": ["Email already registered"]
  }
}
```

---

### 2. Login
**POST** `/api/auth/login/`

Authenticate user and receive JWT tokens.

**Request:**
```json
{
  "username": "john_doe",
  "password": "secure_password_123"
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@exam.local",
    "role_name": "STUDENT",
    ...
  }
}
```

**Error:** `401 Unauthorized`
```json
{
  "status": "error",
  "detail": "Invalid username or password"
}
```

---

### 3. Logout
**POST** `/api/auth/logout/`

Logout and invalidate current tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request:** `{}`

**Response:** `200 OK`
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### 4. Refresh Token
**POST** `/api/auth/refresh/`

Get new access token using refresh token (no auth required).

**Request:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Error:** `401 Unauthorized`
```json
{
  "status": "error",
  "detail": "Refresh token has expired"
}
```

---

### 5. Verify Token
**GET** `/api/auth/verify/`

Verify current access token is valid.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "valid": true,
  "user": {...}
}
```

---

## User Endpoints

### 1. Get Current User Profile
**GET** `/api/users/profile/`

Get authenticated user's full profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "user": {
    "id": "...",
    "username": "john_doe",
    "email": "john@exam.local",
    "role": {...},
    "role_name": "STUDENT",
    "is_active": true,
    "is_admin": false,
    "created_at": "2026-01-31T12:00:00Z",
    "updated_at": "2026-01-31T12:00:00Z",
    "last_login": "2026-01-31T15:30:00Z"
  }
}
```

---

### 2. List All Users (Admin Only)
**GET** `/api/users/?page=1`

List all users with pagination. Admin only.

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "count": 42,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [...]
}
```

**Error:** `403 Forbidden`
```json
{
  "status": "error",
  "detail": "You do not have permission"
}
```

---

### 3. Get User By ID
**GET** `/api/users/{user_id}/`

Get specific user details. Admin or self only.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "user": {...}
}
```

**Error:** `404 Not Found`
```json
{
  "status": "error",
  "detail": "User not found"
}
```

---

### 4. List Users by Role (Admin Only)
**GET** `/api/users/role/{role}/`

Get all users with specific role. Admin only.

**URL Parameters:**
- `role` - One of: `ADMIN`, `INSTRUCTOR`, `STUDENT`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "status": "success",
  "role": "STUDENT",
  "count": 25,
  "users": [...]
}
```

---

## Token Details

### Access Token
- **Lifetime:** 15 minutes
- **Contains:** user_id, username, role, jti, type, iat, exp
- **Used for:** API requests
- **Storage:** Local Storage or Memory

### Refresh Token
- **Lifetime:** 7 days
- **Used for:** Obtaining new access tokens
- **Storage:** Local Storage only

### Token Invalidation
- Tokens are invalidated on logout
- Blacklist stored in Redis + PostgreSQL
- Expired tokens automatically removed after lifetime

---

## Error Codes

| Status | Code | Message |
|--------|------|---------|
| 400 | Bad Request | Invalid input or malformed request |
| 401 | Unauthorized | Invalid credentials or expired token |
| 403 | Forbidden | Insufficient permissions for this action |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## RBAC Matrix

| Endpoint | Anonymous | Student | Instructor | Admin |
|----------|-----------|---------|-----------|-------|
| POST /auth/register | ✅ | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ❌ | ✅ | ✅ | ✅ |
| POST /auth/refresh | ✅ | ✅ | ✅ | ✅ |
| GET /auth/verify | ❌ | ✅ | ✅ | ✅ |
| GET /users/profile | ❌ | ✅ | ✅ | ✅ |
| GET /users/ | ❌ | ❌ | ❌ | ✅ |
| GET /users/{id} | ❌ | own only | ✅ | ✅ |
| GET /users/role/{role} | ❌ | ❌ | ❌ | ✅ |

---

## Example Workflows

### Complete Registration & Login Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "email": "student1@exam.local",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "role": "STUDENT"
  }'

# 2. Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "SecurePass123!"
  }' > token_response.json

# 3. Extract access_token from response and use it
ACCESS_TOKEN=$(jq -r '.access_token' token_response.json)

# 4. Access protected endpoint
curl http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 5. Logout
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Token Refresh Flow

```bash
# When access token expires (after 15 min):
REFRESH_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."

curl -X POST http://localhost:8000/api/auth/refresh/ \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}"

# Use new access_token for subsequent requests
```

---

## Rate Limiting

Currently not implemented in LEVEL 1. Future levels may add:
- Per-user rate limits
- Per-endpoint rate limits
- DDoS protection

---

## Backward Compatibility

LEVEL 1 endpoints are stable and will be maintained as-is in future versions.
New functionality will be added with versioned endpoints: `/api/v2/`, etc.

