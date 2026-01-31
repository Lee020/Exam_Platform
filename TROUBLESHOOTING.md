# Troubleshooting Guide

## Common Issues & Solutions

### 1. "Cannot connect to database" Error

**Symptoms:**
```
psycopg2.OperationalError: could not connect to server: Connection refused
```

**Solutions:**
```bash
# Check if PostgreSQL container is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# If stuck, restart PostgreSQL
docker-compose restart postgres

# Wait 10 seconds for PostgreSQL to initialize
sleep 10

# Try migrations again
docker-compose exec backend python manage.py migrate
```

---

### 2. "Port Already in Use" Error

**Symptoms:**
```
ERROR: for backend  Cannot start service backend: driver failed programming external: Error starting userland proxy
bind: address already in use
```

**Solutions:**

Find process using port:
```bash
# Find process on port 8000
lsof -i :8000
# or
sudo netstat -tlnp | grep 8000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
# ports:
#   - "8001:8000"
```

---

### 3. "No module named 'apps.users'" Error

**Symptoms:**
```
ModuleNotFoundError: No module named 'apps.users'
```

**Solutions:**
```bash
# Ensure correct structure
ls -la backend/apps/users/

# Verify __init__.py files exist in all directories
touch backend/apps/__init__.py
touch backend/apps/users/__init__.py

# Rebuild containers
docker-compose build --no-cache backend
docker-compose up -d backend
```

---

### 4. "Invalid token" on Frontend

**Symptoms:**
- 401 errors on every request
- Token not persisting after refresh

**Solutions:**
```typescript
// Check token in browser console
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')

// Clear and login again
localStorage.clear()
```

**Backend check:**
```bash
# Check token blacklist
docker-compose exec postgres psql -U exam_user -d exam_db -c "SELECT * FROM token_blacklist;"

# Check Redis
docker-compose exec redis redis-cli
> KEYS token_blacklist:*
```

---

### 5. CORS Errors on Frontend

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...' from origin 
'http://localhost:4200' has been blocked by CORS policy
```

**Solutions:**
```bash
# Verify CORS settings in backend
# backend/config/settings.py:
# CORS_ALLOWED_ORIGINS = ['http://localhost:4200', ...]

# Check current setting
docker-compose exec backend python -c \
  "from django.conf import settings; print(settings.CORS_ALLOWED_ORIGINS)"

# Add frontend URL if missing, then restart
docker-compose restart backend
```

---

### 6. "Frontend cannot find backend" Error

**Symptoms:**
```
Error: Cannot POST http://localhost:8000/api/auth/login/
Failed to fetch
```

**Possible causes:**
1. Backend not running
2. API_URL incorrect in environment
3. Network isolation

**Solutions:**
```bash
# Check all containers running
docker-compose ps

# Check backend is responding
curl http://localhost:8000/api/auth/verify/

# Check networks
docker network ls
docker network inspect exam_network

# If network issue, recreate
docker-compose down
docker-compose up -d
```

---

### 7. Migrations Not Applied

**Symptoms:**
```
ProgrammingError: relation "users_user" does not exist
```

**Solutions:**
```bash
# Check migration status
docker-compose exec backend python manage.py showmigrations

# Apply migrations manually
docker-compose exec backend python manage.py migrate

# If corrupted, reset database
docker-compose down -v
docker-compose up -d

# Verify tables created
docker-compose exec postgres psql -U exam_user -d exam_db \
  -c "\dt"
```

---

### 8. RedisConnectionError

**Symptoms:**
```
redis.exceptions.ConnectionError: Error -2 connecting to redis:6379
```

**Solutions:**
```bash
# Check Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

---

### 9. "Migrations file already exists" Error

**Symptoms:**
```
django.core.management.base.SystemExit: 1
```

**Solutions:**
```bash
# List existing migrations
ls -la backend/apps/users/migrations/

# If duplicates exist, remove and regenerate
rm backend/apps/users/migrations/0001_initial.py

# Regenerate migration
docker-compose exec backend python manage.py makemigrations users

# Apply
docker-compose exec backend python manage.py migrate
```

---

### 10. Frontend "Cannot GET /" Error

**Symptoms:**
```
Cannot GET /
Cannot find module '@angular/common'
```

**Solutions:**
```bash
# Check if npm dependencies installed
docker-compose exec frontend npm ls

# Reinstall dependencies
docker-compose exec frontend npm ci
# or
docker-compose exec frontend npm install

# Clear Angular cache
docker-compose exec frontend rm -rf .angular/cache

# Rebuild
docker-compose restart frontend
```

---

### 11. Docker Build Failures

**Symptoms:**
```
ERROR [backend stage-1 2/4] COPY requirements.txt . : COPY failed: file not found
```

**Solutions:**
```bash
# Verify file structure
ls -la backend/requirements.txt

# Check Docker build context
# Ensure .dockerignore doesn't exclude needed files

# Build with verbose output
docker-compose build --progress=plain backend

# Check Dockerfile path
# docker-compose.yml should have:
# build:
#   context: ./backend
#   dockerfile: Dockerfile
```

---

### 12. "Module has no attribute 'JWTAuthentication'"

**Symptoms:**
```
AttributeError: module 'apps.users' has no attribute 'JWTAuthentication'
```

**Solutions:**
```bash
# Verify authentication.py exists
ls -la backend/apps/users/authentication.py

# Check import in settings.py
grep -n "JWTAuthentication" backend/config/settings.py

# Should be:
# 'DEFAULT_AUTHENTICATION_CLASSES': (
#     'apps.users.authentication.JWTAuthentication',
# )

# Rebuild backend
docker-compose build --no-cache backend
docker-compose restart backend
```

---

## Performance Debugging

### Slow Login Response

```bash
# Check backend logs for slow queries
docker-compose logs -f backend | grep "ms"

# Check database connection pool
docker-compose exec postgres psql -U exam_user -d exam_db \
  -c "SELECT count(*) FROM pg_stat_activity;"

# Profile query
docker-compose exec backend python manage.py shell
>>> from django.db import connection
>>> from django.test.utils import CaptureQueriesContext
>>> with CaptureQueriesContext(connection) as context:
...     # Your query here
... print(context)
```

### High CPU Usage

```bash
# Check container resource usage
docker stats exam_backend
docker stats exam_frontend

# Check for infinite loops in logs
docker-compose logs backend | tail -100

# Restart container
docker-compose restart backend
```

---

## Data Recovery

### Backup PostgreSQL

```bash
# Dump database
docker-compose exec postgres pg_dump \
  -U exam_user exam_db > backup.sql

# Save to file
cp backup.sql backups/backup-$(date +%Y%m%d).sql
```

### Restore PostgreSQL

```bash
# Restore from backup
docker-compose exec -T postgres psql \
  -U exam_user exam_db < backup.sql
```

### Reset Everything

```bash
# WARNING: Deletes all data
docker-compose down -v
rm .env

# Start fresh
cp .env.example .env
docker-compose up -d
```

---

## Getting Help

### Collect Debug Information

```bash
# System info
docker-compose version
docker --version
python --version
node --version
npm --version

# Docker logs (all services)
docker-compose logs > debug.log

# Database status
docker-compose exec postgres pg_isready

# Redis status
docker-compose exec redis redis-cli ping

# Backend health
curl -v http://localhost:8000/health/

# Frontend console errors
# Check browser console (F12) for JavaScript errors
```

### Common Commands Reference

```bash
# Stop all services
docker-compose stop

# Start all services
docker-compose start

# Restart specific service
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs redis --tail 50

# Execute command in container
docker-compose exec backend python manage.py shell

# Connect to database
docker-compose exec postgres psql -U exam_user -d exam_db

# Connect to Redis
docker-compose exec redis redis-cli

# Remove containers and volumes
docker-compose down -v
```

---

## Performance Tuning (Optional)

### PostgreSQL Optimization
```bash
# Increase shared buffers
docker-compose exec postgres psql -U exam_user -d exam_db \
  -c "ALTER SYSTEM SET shared_buffers = '256MB';"

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Optimization
```bash
# Check memory usage
docker-compose exec redis redis-cli info memory

# Increase max memory if needed
# Add to docker-compose.yml:
# command: redis-server --appendonly yes --maxmemory 256mb
```

---

## When All Else Fails

### Nuclear Option (Complete Reset)

```bash
# Stop everything
docker-compose down

# Remove all Docker resources
docker volume rm $(docker volume ls -q)
docker network rm exam_network

# Delete local files
rm .env
rm -rf backend/db.sqlite3
rm -rf frontend/node_modules
rm -rf frontend/dist

# Rebuild everything
docker-compose build --no-cache
docker-compose up -d

# Initialize
docker-compose exec backend python manage.py migrate
```

---

## Monitoring & Alerting (Future)

Once configured, monitor:
- Backend CPU and memory
- Database connection pool
- Redis memory usage
- API response times
- 5xx error rates
- Authentication failures

See `MONITORING.md` for setup details (LEVEL 2+).

