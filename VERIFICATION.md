# Verification Checklist

## Pre-Deployment Verification

Run this checklist to verify LEVEL 1 is correctly implemented:

### 1. File Structure Verification

```bash
# Run from test_app directory
cd /home/vvdn/Documents/test_app

# Check key files exist
[ -f "README.md" ] && echo "✓ README.md" || echo "✗ README.md missing"
[ -f "docker-compose.yml" ] && echo "✓ docker-compose.yml" || echo "✗ docker-compose.yml missing"
[ -f ".env.example" ] && echo "✓ .env.example" || echo "✗ .env.example missing"
[ -f "backend/manage.py" ] && echo "✓ backend/manage.py" || echo "✗ backend/manage.py missing"
[ -f "backend/requirements.txt" ] && echo "✓ backend/requirements.txt" || echo "✗ backend/requirements.txt missing"
[ -f "frontend/package.json" ] && echo "✓ frontend/package.json" || echo "✗ frontend/package.json missing"
[ -f "backend/apps/users/models.py" ] && echo "✓ users models" || echo "✗ users models missing"
[ -f "backend/apps/users/authentication.py" ] && echo "✓ JWT auth" || echo "✗ JWT auth missing"
[ -f "frontend/src/app/auth/services/auth.service.ts" ] && echo "✓ auth service" || echo "✗ auth service missing"
```

**Expected Output:**
```
✓ README.md
✓ docker-compose.yml
✓ .env.example
✓ backend/manage.py
✓ backend/requirements.txt
✓ frontend/package.json
✓ users models
✓ JWT auth
✓ auth service
```

### 2. Django Backend Verification

```bash
# Check settings.py contains required configurations
grep -q "JWT_CONFIG" backend/config/settings.py && echo "✓ JWT config" || echo "✗ JWT config"
grep -q "CORS_ALLOWED_ORIGINS" backend/config/settings.py && echo "✓ CORS config" || echo "✗ CORS config"
grep -q "apps.users" backend/config/settings.py && echo "✓ Users app" || echo "✗ Users app"
grep -q "rest_framework" backend/config/settings.py && echo "✓ DRF" || echo "✗ DRF"

# Check models defined
grep -q "class User" backend/apps/users/models.py && echo "✓ User model" || echo "✗ User model"
grep -q "class Role" backend/apps/users/models.py && echo "✓ Role model" || echo "✗ Role model"
grep -q "class TokenBlacklist" backend/apps/users/models.py && echo "✓ TokenBlacklist model" || echo "✗ TokenBlacklist model"

# Check API endpoints
grep -q "def register_view" backend/apps/users/views_auth.py && echo "✓ Register endpoint" || echo "✗ Register endpoint"
grep -q "def login_view" backend/apps/users/views_auth.py && echo "✓ Login endpoint" || echo "✗ Login endpoint"
grep -q "def logout_view" backend/apps/users/views_auth.py && echo "✓ Logout endpoint" || echo "✗ Logout endpoint"
grep -q "def refresh_token_view" backend/apps/users/views_auth.py && echo "✓ Refresh endpoint" || echo "✗ Refresh endpoint"

# Check RBAC
grep -q "class IsAdmin" backend/apps/users/permissions.py && echo "✓ IsAdmin permission" || echo "✗ IsAdmin permission"
grep -q "class IsInstructor" backend/apps/users/permissions.py && echo "✓ IsInstructor permission" || echo "✗ IsInstructor permission"
grep -q "class IsStudent" backend/apps/users/permissions.py && echo "✓ IsStudent permission" || echo "✗ IsStudent permission"
```

### 3. Angular Frontend Verification

```bash
# Check app structure
grep -q "AuthModule" frontend/src/app/app.module.ts && echo "✓ AuthModule imported" || echo "✗ AuthModule"
grep -q "AuthGuard" frontend/src/app/app-routing.module.ts && echo "✓ AuthGuard" || echo "✗ AuthGuard"

# Check services
grep -q "class AuthService" frontend/src/app/auth/services/auth.service.ts && echo "✓ AuthService" || echo "✗ AuthService"
grep -q "login" frontend/src/app/auth/services/auth.service.ts && echo "✓ login method" || echo "✗ login method"
grep -q "logout" frontend/src/app/auth/services/auth.service.ts && echo "✓ logout method" || echo "✗ logout method"
grep -q "register" frontend/src/app/auth/services/auth.service.ts && echo "✓ register method" || echo "✗ register method"

# Check interceptor
grep -q "class AuthInterceptor" frontend/src/app/auth/interceptors/auth.interceptor.ts && echo "✓ AuthInterceptor" || echo "✗ AuthInterceptor"
grep -q "refreshAccessToken" frontend/src/app/auth/interceptors/auth.interceptor.ts && echo "✓ Token refresh logic" || echo "✗ Token refresh"

# Check components
grep -q "LoginComponent" frontend/src/app/auth/components/login.component.ts && echo "✓ LoginComponent" || echo "✗ LoginComponent"
grep -q "RegisterComponent" frontend/src/app/auth/components/register.component.ts && echo "✓ RegisterComponent" || echo "✗ RegisterComponent"
```

### 4. Docker Configuration Verification

```bash
# Check docker-compose.yml
grep -q "postgres" docker-compose.yml && echo "✓ PostgreSQL service" || echo "✗ PostgreSQL"
grep -q "redis" docker-compose.yml && echo "✓ Redis service" || echo "✗ Redis"
grep -q "backend" docker-compose.yml && echo "✓ Backend service" || echo "✗ Backend"
grep -q "frontend" docker-compose.yml && echo "✓ Frontend service" || echo "✗ Frontend"
grep -q "exam_network" docker-compose.yml && echo "✓ Network defined" || echo "✗ Network"

# Check Dockerfiles
[ -f "backend/Dockerfile" ] && grep -q "python:3.11" backend/Dockerfile && echo "✓ Backend Dockerfile" || echo "✗ Backend Dockerfile"
[ -f "frontend/Dockerfile" ] && grep -q "node:20" frontend/Dockerfile && echo "✓ Frontend Dockerfile" || echo "✗ Frontend Dockerfile"
```

### 5. Documentation Verification

```bash
# Check all documentation exists
[ -f "README.md" ] && wc -l README.md | grep -oE "^[0-9]+" | awk '{if($1>100) print "✓ README.md (" $1 " lines)"; else print "✗ README.md (too short)"}' || echo "✗ README.md"
[ -f "API_DOCS.md" ] && wc -l API_DOCS.md | grep -oE "^[0-9]+" | awk '{if($1>500) print "✓ API_DOCS.md (" $1 " lines)"; else print "✗ API_DOCS.md"}' || echo "✗ API_DOCS.md"
[ -f "ARCHITECTURE.md" ] && wc -l ARCHITECTURE.md | grep -oE "^[0-9]+" | awk '{if($1>500) print "✓ ARCHITECTURE.md (" $1 " lines)"; else print "✗ ARCHITECTURE.md"}' || echo "✗ ARCHITECTURE.md"
[ -f "SECURITY.md" ] && wc -l SECURITY.md | grep -oE "^[0-9]+" | awk '{if($1>300) print "✓ SECURITY.md (" $1 " lines)"; else print "✗ SECURITY.md"}' || echo "✗ SECURITY.md"
[ -f "DEVELOPMENT.md" ] && wc -l DEVELOPMENT.md | grep -oE "^[0-9]+" | awk '{if($1>300) print "✓ DEVELOPMENT.md (" $1 " lines)"; else print "✗ DEVELOPMENT.md"}' || echo "✗ DEVELOPMENT.md"
[ -f "TROUBLESHOOTING.md" ] && wc -l TROUBLESHOOTING.md | grep -oE "^[0-9]+" | awk '{if($1>300) print "✓ TROUBLESHOOTING.md (" $1 " lines)"; else print "✗ TROUBLESHOOTING.md"}' || echo "✗ TROUBLESHOOTING.md"
```

### 6. Dependencies Verification

```bash
# Check Python dependencies
grep -q "Django==4.2" backend/requirements.txt && echo "✓ Django 4.2" || echo "✗ Django"
grep -q "djangorestframework" backend/requirements.txt && echo "✓ DRF" || echo "✗ DRF"
grep -q "PyJWT" backend/requirements.txt && echo "✓ PyJWT" || echo "✗ PyJWT"
grep -q "psycopg2" backend/requirements.txt && echo "✓ psycopg2" || echo "✗ psycopg2"
grep -q "redis" backend/requirements.txt && echo "✓ redis" || echo "✗ redis"

# Check Node dependencies
grep -q "@angular/core" frontend/package.json && echo "✓ Angular" || echo "✗ Angular"
grep -q "typescript" frontend/package.json && echo "✓ TypeScript" || echo "✗ TypeScript"
grep -q "rxjs" frontend/package.json && echo "✓ RxJS" || echo "✗ RxJS"
```

---

## Runtime Verification

Run this after starting the services to verify everything works:

### 1. Service Health Checks

```bash
# Check all services are running
docker-compose ps

# Expected output:
# NAME         STATUS          PORTS
# exam_postgres   Up (healthy)   5432->5432/tcp
# exam_redis      Up (healthy)   6379->6379/tcp
# exam_backend    Up             8000->8000/tcp
# exam_frontend   Up             4200->4200/tcp
```

### 2. Database Connectivity

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U exam_user
# Expected: accepting connections

# Check Redis
docker-compose exec redis redis-cli ping
# Expected: PONG

# Check tables exist
docker-compose exec postgres psql -U exam_user -d exam_db -c "\dt"
# Should show: users, roles, token_blacklist
```

### 3. Backend API Health

```bash
# Check backend is responding
curl http://localhost:8000/health/
# Expected: 200 OK

# Check API is available
curl -s http://localhost:8000/api/auth/register/ -X OPTIONS | head -1
# Expected: HTTP/1.1 200 OK or similar
```

### 4. Frontend Availability

```bash
# Check frontend is serving
curl -s http://localhost:4200/index.html | head -1
# Expected: <!doctype html>
```

### 5. End-to-End Test

```bash
#!/bin/bash
set -e

echo "🧪 Running LEVEL 1 verification tests..."

# 1. Register a user
echo "1. Testing registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@exam.local",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "role": "STUDENT"
  }')

if echo "$REGISTER_RESPONSE" | grep -q '"status":"success"'; then
    echo "✓ Registration works"
else
    echo "✗ Registration failed"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

# 2. Login
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q '"access_token"'; then
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -oE '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "✓ Login works (token: ${ACCESS_TOKEN:0:20}...)"
else
    echo "✗ Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

# 3. Access protected endpoint
echo "3. Testing protected endpoint..."
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q '"username":"testuser"'; then
    echo "✓ Protected endpoint works"
else
    echo "✗ Protected endpoint failed"
    echo "$PROFILE_RESPONSE"
    exit 1
fi

# 4. Logout
echo "4. Testing logout..."
LOGOUT_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$LOGOUT_RESPONSE" | grep -q '"status":"success"'; then
    echo "✓ Logout works"
else
    echo "✗ Logout failed"
    echo "$LOGOUT_RESPONSE"
    exit 1
fi

# 5. Verify token blacklisted
echo "5. Testing token invalidation..."
INVALID_RESPONSE=$(curl -s -X GET http://localhost:8000/api/users/profile/ \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$INVALID_RESPONSE" | grep -q -E '"detail".*revoked|expired'; then
    echo "✓ Token invalidation works"
else
    echo "✗ Token invalidation failed"
    echo "$INVALID_RESPONSE"
fi

echo ""
echo "✅ All tests passed! LEVEL 1 is working correctly."
echo ""
```

### 6. Frontend Verification (via Browser)

1. Open http://localhost:4200 in browser
2. You should see login page
3. Click "Register here"
4. Fill in registration form:
   - Username: testuser2
   - Email: testuser2@exam.local
   - Password: TestPass456!
   - Confirm: TestPass456!
   - Role: Student
5. Click Register → should redirect to login
6. Login with testuser2 / TestPass456!
7. Should see dashboard with user profile
8. Verify role badge shows "Student"
9. Click Logout → should redirect to login

---

## Success Criteria

### ✅ Structure Verification
- [ ] All 48 files present
- [ ] Backend apps/users directory complete
- [ ] Frontend src/app structure complete
- [ ] Docker compose file present
- [ ] 6 documentation files present

### ✅ Code Verification
- [ ] Django models defined (User, Role, TokenBlacklist)
- [ ] JWT authentication implemented
- [ ] RBAC permissions defined
- [ ] All API endpoints implemented
- [ ] Angular auth module complete
- [ ] Auth interceptor working
- [ ] Route guards implemented

### ✅ Infrastructure Verification
- [ ] docker-compose.yml valid
- [ ] Both Dockerfiles present
- [ ] .env.example configured
- [ ] Health checks defined

### ✅ Runtime Verification
- [ ] All 4 services start successfully
- [ ] PostgreSQL accepting connections
- [ ] Redis responding to ping
- [ ] Backend API responding
- [ ] Frontend serving HTML

### ✅ Functional Verification
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens generated
- [ ] Token refresh works
- [ ] Protected endpoints require auth
- [ ] RBAC enforced
- [ ] Logout invalidates tokens
- [ ] Frontend login/register UI works
- [ ] Route guards working

---

## If Issues Found

1. **Check logs:** `docker-compose logs <service>`
2. **Verify structure:** Run file verification script above
3. **Restart services:** `docker-compose restart`
4. **Reset:** `docker-compose down -v && docker-compose up -d`
5. **Check .env:** Ensure copy of .env.example
6. **Review:** See TROUBLESHOOTING.md

---

## Performance Baseline

These are expected performance metrics:

- **Registration:** <500ms
- **Login:** <300ms
- **Profile fetch:** <100ms
- **Token refresh:** <200ms
- **List users:** <500ms
- **Database query:** <50ms
- **API response:** <100ms

---

**Run this checklist to verify LEVEL 1 is correctly implemented and operational.**

✅ = Implementation Complete
⚠️ = Requires Attention
❌ = Not Implemented

