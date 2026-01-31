# Architecture & Design Decisions

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT TIER                              │
│  Angular 18 SPA (Login, Register, Dashboard)                │
│  ├─ Auth Module (Login, Register, Guards)                   │
│  ├─ JWT Token Management (Local Storage)                    │
│  └─ HTTP Interceptor (Token Injection & Refresh)            │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JSON/HTTP)
┌────────────────────▼────────────────────────────────────────┐
│                  API TIER                                    │
│  Django REST Framework (Python 3.11, Django 4.2 LTS)        │
│  ├─ Auth Views (Register, Login, Logout, Refresh)           │
│  ├─ User Views (Profile, List, Detail, by-role)             │
│  ├─ JWT Authentication (PyJWT)                              │
│  ├─ RBAC Permission System                                  │
│  └─ Exception Handling & Logging                            │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
┌────────▼────┐  ┌───▼─────┐  ┌─▼──────────┐
│ PostgreSQL  │  │  Redis  │  │ Migrations │
│  Database   │  │  Cache  │  │   System   │
├─────────────┤  ├─────────┤  ├────────────┤
│ Users       │  │ Token   │  │ Versioned  │
│ Roles       │  │ Blacklist   │ Schemas  │
│ TokenBL     │  │ Cache   │  │            │
└─────────────┘  └─────────┘  └────────────┘
```

---

## Database Schema

### users (User Table)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR(150) UNIQUE NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- hashed with PBKDF2
  role_id UUID NOT NULL REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP NULL
);
```

### roles (Role Table)
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL,  -- ADMIN, INSTRUCTOR, STUDENT
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### token_blacklist (Token Invalidation)
```sql
CREATE TABLE token_blacklist (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_jti VARCHAR(500) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_token_jti ON token_blacklist(token_jti);
CREATE INDEX idx_expires_at ON token_blacklist(expires_at);
```

---

## Authentication Flow

### 1. Registration
```
Client                          Backend
  │                               │
  ├─ POST /api/auth/register/    ─>
  │ {username, email, password}   │
  │                               ├─ Validate input
  │                               ├─ Hash password (PBKDF2)
  │                               ├─ Create user + default role
  │                               ├─ Store in PostgreSQL
  │  {status, user}              <─
  │                               │
```

### 2. Login
```
Client                          Backend
  │                               │
  ├─ POST /api/auth/login/       ─>
  │ {username, password}          │
  │                               ├─ Look up user
  │                               ├─ Verify password
  │                               ├─ Generate tokens
  │                               │  ├─ Access Token (15 min)
  │                               │  └─ Refresh Token (7 days)
  │  {access, refresh, user}     <─
  │                               │
  ├─ Save tokens to localStorage  │
  │                               │
```

### 3. API Request with Token
```
Client                          Interceptor               Backend
  │                                 │                        │
  ├─ GET /api/users/profile/       │                        │
  │                                 ├─ Get token from storage│
  │                                 ├─ Inject Authorization  │
  │  GET w/ Bearer token           ─────────────────────>    │
  │                                                           ├─ Parse JWT
  │                                                           ├─ Verify signature
  │                                                           ├─ Check blacklist
  │                                                           ├─ Verify role
  │                                 {user profile}          <─
  │                                 │
  │  {user profile}                <─
  │                                 │
```

### 4. Token Refresh
```
Client                          Backend
  │                               │
  │ (Access token expired)         │
  ├─ POST /api/auth/refresh/     ─>
  │ {refresh_token}               │
  │                               ├─ Verify refresh token
  │                               ├─ Check blacklist
  │                               ├─ Generate new access token
  │  {new_access_token}          <─
  │                               │
  ├─ Update localStorage          │
  │                               │
```

### 5. Logout
```
Client                          Backend
  │                               │
  ├─ POST /api/auth/logout/      ─>
  │ (with access_token)           │
  │                               ├─ Extract token JTI
  │                               ├─ Add to blacklist
  │                               │  ├─ Redis (fast lookup)
  │                               │  └─ PostgreSQL (persistent)
  │  {status: success}           <─
  │                               │
  ├─ Clear localStorage           │
  │                               │
```

---

## JWT Token Structure

### Access Token Payload
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "john_doe",
  "role": "STUDENT",
  "jti": "unique-token-id",
  "type": "access",
  "iat": 1706787600,
  "exp": 1706788500
}
```

### Refresh Token Payload
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "jti": "unique-token-id",
  "type": "refresh",
  "iat": 1706787600,
  "exp": 1707392400
}
```

**Token Encoding:**
- Algorithm: HS256 (HMAC SHA-256)
- Signing Key: Django SECRET_KEY or JWT_SECRET_KEY env var
- Encoding: Base64URL

---

## RBAC (Role-Based Access Control)

### Implementation Layers

#### Layer 1: Backend API Permissions
```python
# Permission decorators on views
@permission_classes([IsAdmin])
def list_users_view(request):
    ...

@permission_classes([IsAuthenticated])
def profile_view(request):
    ...
```

#### Layer 2: Frontend Route Guards
```typescript
// Angular CanActivate guard
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard],
  data: { role: 'ADMIN' }
}
```

### Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Platform administrator | Full system access, all APIs |
| **INSTRUCTOR** | Content creator | Create exams, manage students (future) |
| **STUDENT** | Learner | Take exams, view grades (future) |

### Permission Matrix

```
Endpoint                    Anonymous  Student  Instructor  Admin
─────────────────────────────────────────────────────────────────
POST /auth/register         ✅         ✅       ✅          ✅
POST /auth/login            ✅         ✅       ✅          ✅
GET  /users/profile         ❌         ✅       ✅          ✅
GET  /users/                ❌         ❌       ❌          ✅
GET  /users/{id}            ❌         own only ✅          ✅
GET  /users/role/{role}     ❌         ❌       ❌          ✅
```

---

## Security Decisions

### 1. Password Hashing
**Decision:** Use Django's default (PBKDF2 with SHA256)
- **Why:** Secure, well-tested, no external dependencies
- **Alternative:** bcrypt (library not included)
- **Trade-off:** PBKDF2 is slightly slower (good for password security)

### 2. JWT Storage Location
**Decision:** Local Storage (browser)
- **Why:** Survives page refresh, simple implementation
- **Security Notes:**
  - ⚠️ Vulnerable to XSS attacks
  - ✅ Mitigated by Content-Security-Policy header (future)
  - ✅ Short-lived access tokens (15 min)
- **Alternatives:**
  - HttpOnly cookie: More secure, but requires CSRF handling
  - Memory-only: Lost on page refresh

### 3. Token Invalidation Strategy
**Decision:** Blacklist + TTL
- **Implementation:**
  - Redis for fast lookup (primary)
  - PostgreSQL for persistence (fallback)
  - Time-indexed for automatic cleanup
- **Why:** Handles logout, token revocation
- **Alternative:** Token versioning (not implemented)

### 4. Role Enforcement
**Decision:** Backend-authoritative
- **Why:** Client-side guards can be bypassed
- **Implementation:** Every protected endpoint validates role
- **Frontend guards:** UX optimization, not security

### 5. CORS Configuration
**Decision:** Whitelist localhost URLs only
- **Local Deployment:** All traffic on localhost allowed
- **Production:** Would use environment-specific whitelists
- **Why:** Prevents cross-origin attacks

---

## Performance Considerations

### Caching Strategy
```
├─ Redis
│  ├─ Token Blacklist (TTL = token lifetime)
│  ├─ Session State (future)
│  └─ Rate Limiting Counters (future)
│
└─ Database Query Optimization
   ├─ select_related('role') on user queries
   ├─ Index on token_jti
   └─ Index on expires_at (auto cleanup)
```

### Database Queries
- User lookup: 1 query + cache
- Token verification: Redis (fast) + DB fallback
- Role checking: In-memory from JWT payload

### Scaling Considerations (LEVEL 2+)
- Connection pooling (pgBouncer)
- Redis clustering
- Load balancing with session affinity
- Horizontal scaling with stateless JWT

---

## Error Handling

### HTTP Status Codes
```
200 OK              - Successful request
201 Created         - Resource created
400 Bad Request     - Invalid input
401 Unauthorized    - Auth failed / expired
403 Forbidden       - Insufficient permissions
404 Not Found       - Resource not found
500 Server Error    - Unexpected error
```

### Error Response Format
```json
{
  "status": "error",
  "detail": "error message",
  "errors": {
    "field": ["error1", "error2"]
  }
}
```

---

## Deployment Architecture

### Local (Docker Compose)
```
Client Browser
    ↓ HTTP
Nginx/Apache (reverse proxy - future)
    ├→ :8000 Django Backend
    ├→ :4200 Angular Frontend
    └→ :3000 Admin Panel (future)
         ↓
    PostgreSQL :5432
    Redis :6379
```

### Production Considerations (Future)
- K8s deployment with service mesh
- Separate API and Static hosting
- CDN for frontend assets
- Managed PostgreSQL/Redis
- Load balancing and auto-scaling
- Monitoring and alerting

---

## Maintainability & Extensibility

### Code Organization
```
backend/
├─ apps/users/          # Auth app (self-contained)
│  ├─ models.py         # User, Role, TokenBlacklist
│  ├─ views_auth.py     # Authentication views
│  ├─ views_users.py    # User management
│  ├─ authentication.py  # JWT implementation
│  ├─ permissions.py    # RBAC decorators
│  └─ serializers.py    # Request/response
│
└─ config/              # Django settings (centralized)
```

### Frontend Structure
```
frontend/src/app/
├─ auth/
│  ├─ services/         # AuthService
│  ├─ guards/           # AuthGuard (route protection)
│  ├─ interceptors/     # Token injection & refresh
│  └─ components/       # Login, Register
│
├─ dashboard/           # Main app view
└─ app-routing.module   # Route definitions
```

### Adding New Features (LEVEL 2+)
1. Create new Django app: `apps/exams/`
2. Define models, views, permissions
3. Create Angular feature module
4. Add routes with guards
5. Update API documentation
6. Add tests

---

## Version History

| Level | Status | Features |
|-------|--------|----------|
| **LEVEL 1** | ✅ Complete | Auth, RBAC, JWT, User management |
| LEVEL 2 | Planned | Exam creation, question banks |
| LEVEL 3 | Planned | Student assessments, submissions |
| LEVEL 4 | Planned | Grading, analytics, reporting |

