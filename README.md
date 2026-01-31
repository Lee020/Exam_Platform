# LEVEL 1 - Online Exam Platform
## Core Access System

A fully functional authentication and role-based access control system for an online exam platform, running 100% locally with zero external dependencies.

### Architecture

```
test_app/
├── backend/              # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/          # Django settings
│   └── apps/
│       ├── auth/        # Authentication app
│       └── users/       # User management
├── frontend/            # Angular application
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/    # Auth module
│   │   │   └── guards/  # Route guards
│   │   └── main.ts
├── docker-compose.yml   # Local infrastructure
├── .env.example         # Environment template
└── README.md
```

### Technology Stack (LTS Only)

**Backend:**
- Python 3.11+
- Django 4.2 LTS
- Django REST Framework 3.14+
- PyJWT 2.8+

**Frontend:**
- Angular 18 LTS
- TypeScript 5.2+
- RxJS 7.8+

**Database & State:**
- PostgreSQL 15+
- Redis 7+

**Infrastructure:**
- Docker & Docker Compose
- No cloud services

### LEVEL 1 Features

✅ **User Registration** - Local user creation with username/email and password
✅ **Login/Logout** - JWT authentication with refresh tokens
✅ **Password Security** - Django built-in bcrypt hashing
✅ **Roles** - ADMIN, INSTRUCTOR, STUDENT
✅ **RBAC** - Role-based API protection and frontend route guards

### Quick Start

#### 1. Prerequisites
- Docker & Docker Compose installed
- Git

#### 2. Clone and Setup
```bash
cd /home/vvdn/Documents/test_app
cp .env.example .env
```

#### 3. Start Services
```bash
docker-compose up -d
```

This starts:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:4200
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

#### 4. Test the System

**Register a user:**
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@exam.local",
    "password": "secure_password_123",
    "role": "ADMIN"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "secure_password_123"
  }'
```

This returns:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@exam.local",
    "role": "ADMIN"
  }
}
```

**Access protected endpoint:**
```bash
curl http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer <access_token>"
```

### API Documentation

#### Authentication Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register/` | POST | No | Register new user |
| `/api/auth/login/` | POST | No | Login and get tokens |
| `/api/auth/logout/` | POST | Yes | Logout (invalidate tokens) |
| `/api/auth/refresh/` | POST | No | Refresh access token |

#### User Endpoints

| Endpoint | Method | Auth | Roles | Description |
|----------|--------|------|-------|-------------|
| `/api/users/profile/` | GET | Yes | Any | Get current user profile |
| `/api/users/` | GET | Yes | ADMIN | List all users |
| `/api/users/{id}/` | GET | Yes | ADMIN,INSTRUCTOR | Get user details |

### Architecture Decisions

#### JWT Storage
- **Approach**: Local Storage (with fallback to memory)
- **Trade-offs**: 
  - ✅ Survives page refresh
  - ⚠️ Vulnerable to XSS (mitigate with CSP)
  - ✅ No server-side session storage needed

#### Token Lifecycle
- **Access Token**: 15 minutes (short-lived, API access)
- **Refresh Token**: 7 days (long-lived, renew access)
- **Invalidation**: Token blacklist in Redis (logout)

#### RBAC Implementation
- **Backend**: Decorator-based permissions on views
- **Frontend**: Route guards prevent unauthorized navigation
- **Principle**: Backend is authoritative

### Extending Beyond LEVEL 1

Future levels will add:
- Exam creation and management
- Question banks
- Student assessments
- Grading system
- Analytics and reporting

All following LTS versions and local-only deployment constraints.

### Security Notes

- ✅ Passwords hashed with Django's default (PBKDF2/bcrypt)
- ✅ CSRF protection on all POST/PUT/DELETE endpoints
- ✅ CORS configured for local development
- ✅ No hardcoded secrets in repository
- ✅ JWT keys rotated per deployment
- ⚠️ Tokens in local storage are XSS-vulnerable; use CSP headers

### Troubleshooting

**"Connection refused" on localhost:8000:**
- Wait 10s for services to start: `docker-compose logs backend`

**"Cannot connect to database":**
- Check PostgreSQL container: `docker-compose logs postgres`
- Reset database: `docker-compose down -v && docker-compose up`

**"Invalid token" errors:**
- Tokens expire after 15 minutes
- Use refresh endpoint to get new access token
- Clear local storage and re-login if corruption suspected

### Support

For questions or issues, refer to the inline code documentation in the respective apps.

---

**Status**: LEVEL 1 ✅ Complete
**Last Updated**: January 31, 2026
