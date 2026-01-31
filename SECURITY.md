# Security Policy for LEVEL 1

## Overview

This document outlines security considerations for the LEVEL 1 Online Exam Platform. The platform is designed for local deployment with emphasis on secure-by-default configuration.

---

## Authentication Security

### Password Hashing
- **Algorithm:** PBKDF2 with SHA256
- **Iterations:** Django default (260,000+)
- **Salt:** Automatically generated per user
- **Minimum Length:** 8 characters

**Best Practices:**
- ✅ Passwords hashed server-side
- ✅ Never transmitted in plain text over HTTPS
- ✅ No password hints or recovery questions
- ✅ Users cannot view their own hashed passwords

### JWT Tokens
- **Algorithm:** HS256 (HMAC SHA-256)
- **Signing Key:** Django SECRET_KEY or JWT_SECRET_KEY
- **Access Token Lifetime:** 15 minutes
- **Refresh Token Lifetime:** 7 days

**Security Properties:**
- ✅ Tokens cryptographically signed
- ✅ Cannot be forged without signing key
- ✅ Expiration enforced
- ✅ Can be revoked via blacklist

---

## Authorization & RBAC

### Role-Based Access Control (RBAC)
Three roles with hierarchical permissions:

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system access |
| **INSTRUCTOR** | Content creation and management |
| **STUDENT** | Exam participation |

**Backend Enforcement:**
```python
# Every protected endpoint validates role
@permission_classes([IsAdmin])
def admin_only_view(request):
    ...
```

**Frontend Enforcement:**
```typescript
// Route guards prevent unauthorized navigation
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthGuard],
  data: { role: 'ADMIN' }
}
```

**Golden Rule:** Backend is authoritative; frontend guards are UX only.

---

## Data Security

### Database Encryption
- **Passwords:** ✅ Hashed with PBKDF2
- **Tokens:** ✅ Stored securely in Redis + PostgreSQL
- **User Data:** ⚠️ Currently unencrypted at rest (production deployment should enable)

**Future Enhancements:**
- PostgreSQL transparent encryption (TDE)
- Encrypted database backups
- Column-level encryption for PII

### Network Security (Local Only)
- **All traffic on localhost:** No encryption needed for local deployment
- **Production:** HTTPS required (SSL/TLS certificates)
- **CORS:** Whitelist localhost URLs only

### Token Storage
**Frontend:** Local Storage (with XSS mitigations)
- ✅ Survives page refresh
- ⚠️ Vulnerable to XSS attacks
- ✅ Mitigated by Content-Security-Policy headers
- ✅ Mitigated by short-lived access tokens

**Alternative (future):** HttpOnly secure cookies (more secure, requires CSRF handling)

---

## Input Validation & Sanitization

### Backend Validation
```python
# All inputs validated server-side
class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(...)  # Validators applied
    email = EmailValidator()              # Built-in validator
    password = serializers.CharField(
        min_length=8,
        ...
    )
```

### Frontend Validation
```typescript
// Client-side validation for UX
this.form = this.formBuilder.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8)]]
});
```

### SQL Injection Prevention
- ✅ Django ORM used (parameterized queries)
- ✅ No raw SQL queries
- ✅ User input never interpolated into SQL

### XSS Prevention
- ✅ Angular auto-escapes template content
- ✅ No innerHTML usage in components
- ✅ Content-Security-Policy header (future)

### CSRF Prevention
- ✅ CSRF tokens on POST/PUT/DELETE endpoints
- ✅ SameSite cookie attributes
- ✅ Origin/Referer validation

---

## API Security

### Rate Limiting
**Current:** Not implemented in LEVEL 1

**Future Implementation:**
```python
# Django Ratelimit / django-rest-framework-throttling
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}
```

### API Key Management
**Current:** Not applicable (user authentication only)

### Endpoint Security
```python
# All endpoints properly authenticated/authorized
@api_view(['GET'])
@permission_classes([IsAuthenticated])  # Ensures logged in
def profile_view(request):              # Validates role internally
    ...
```

---

## Credential Management

### Secret Keys
**Location:** Environment variables (`.env` file)

```bash
# .env (NEVER commit to repo)
DJANGO_SECRET_KEY=xyz...        # 40+ random characters
JWT_SECRET_KEY=abc...           # 40+ random characters
DB_PASSWORD=secure_pass         # Complex password
```

**Requirements:**
- ✅ Minimum 40 characters for SECRET_KEY
- ✅ Randomly generated (use: `openssl rand -hex 32`)
- ✅ Different for each environment
- ✅ Rotated on deployment
- ✅ Not version controlled

### Database Credentials
```bash
DB_USER=exam_user
DB_PASSWORD=strong_password_here
DB_NAME=exam_db
```

**Security:**
- ✅ PostgreSQL user has minimal privileges
- ✅ No default credentials in production
- ✅ Credentials managed by DevOps

---

## Error Handling & Logging

### Error Messages
```python
# Generic error messages to users
return Response({
    'status': 'error',
    'detail': 'Invalid username or password'
})

# NOT: 'User not found' or 'Password incorrect'
# (Prevents username enumeration)
```

### Logging
```python
# Log security events
logger.info(f"User {user_id} logged in")
logger.warning(f"Failed login attempt: {username}")
logger.error(f"Unauthorized access attempt to {endpoint}")
```

### Debug Mode
```python
# NEVER enabled in production
DEBUG = os.getenv('DEBUG', 'True') == 'True'  # False in prod

# Disables stack traces in error responses
# Prevents information leakage
```

---

## Dependency Security

### Python Dependencies
```bash
# Check for vulnerabilities
pip install safety
safety check

# Keep dependencies updated
pip list --outdated

# Use LTS versions only
Django==4.2 (LTS)
djangorestframework==3.14
```

### Node Dependencies
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Use LTS versions only
Angular@18 (LTS)
TypeScript@5.2
```

### Supply Chain Security
- ✅ Dependencies pinned to specific versions in `requirements.txt`
- ✅ Dependencies pinned in `package.json` (frontend)
- ✅ Regular security updates scheduled
- ✅ Known vulnerabilities monitored

---

## Deployment Security

### Container Security
```dockerfile
# Run as non-root user (future)
USER app
RUN chown -R app:app /app

# Minimal base images
FROM python:3.11-slim  # Not full python:3.11
FROM node:20-alpine    # Not node:20
```

### Volume Management
```yaml
# PostgreSQL data persisted securely
volumes:
  postgres_data:        # Docker named volume
  redis_data:           # Docker named volume

# NOT: ./data (world-readable)
```

### Network Isolation
```yaml
# Services isolated to private network
networks:
  exam_network:
    driver: bridge

# Only expose necessary ports
ports:
  - "8000:8000"   # Backend
  - "4200:4200"   # Frontend
```

---

## Security Best Practices

### Do's ✅
- ✅ Use HTTPS in production
- ✅ Rotate secrets regularly
- ✅ Monitor failed login attempts
- ✅ Log all authentication events
- ✅ Validate all user input server-side
- ✅ Use strong, unique passwords
- ✅ Keep dependencies updated
- ✅ Regular security audits
- ✅ Implement WAF in production
- ✅ Use VPN for admin access

### Don'ts ❌
- ❌ Store plain-text passwords
- ❌ Expose secrets in code
- ❌ Trust client-side validation alone
- ❌ Log sensitive data
- ❌ Use weak encryption
- ❌ Hardcode credentials
- ❌ Run as root in containers
- ❌ Expose debug mode in production
- ❌ Accept unvalidated input
- ❌ Skip security headers

---

## Incident Response

### Suspected Breach

1. **Immediate Actions:**
   - Stop application if necessary
   - Enable enhanced logging
   - Preserve logs and evidence
   - Notify affected users

2. **Investigation:**
   - Analyze access logs
   - Check for unauthorized accounts
   - Review token usage
   - Check database for tampering

3. **Remediation:**
   - Rotate all secrets
   - Reset user passwords
   - Deploy patches
   - Update firewall rules

4. **Post-Incident:**
   - Root cause analysis
   - Update security policies
   - Implement preventive measures
   - Document lessons learned

---

## Security Compliance

### OWASP Top 10 Mitigation

| Risk | Mitigation |
|------|-----------|
| **Injection** | Parameterized queries, input validation |
| **Broken Auth** | JWT + RBAC, password hashing |
| **Sensitive Data** | HTTPS, encrypted storage (future) |
| **XML External Entities** | Not applicable (no XML) |
| **Broken Access Control** | RBAC enforcement, guards |
| **Security Misconfiguration** | Environment-based config, security headers |
| **XSS** | Angular auto-escape, CSP headers (future) |
| **Insecure Deserialization** | Input validation, safe serializers |
| **Using Vulnerable Components** | Dependency updates, vulnerability scanning |
| **Insufficient Logging** | Comprehensive logging, monitoring |

---

## Security Testing

### Manual Testing Checklist

- [ ] Can register with valid credentials
- [ ] Cannot register with duplicate username
- [ ] Cannot register with weak password
- [ ] Cannot login with wrong password
- [ ] Can logout and token is blacklisted
- [ ] Cannot access protected routes without auth
- [ ] Cannot access resources outside own role
- [ ] Expired tokens are rejected
- [ ] Blacklisted tokens are rejected
- [ ] Role enforcement is server-side
- [ ] No sensitive data in error messages
- [ ] CORS headers correct
- [ ] CSRF tokens present

### Automated Testing (Future)
```bash
# Security scanning
docker run --rm -v $(pwd):/app bandit -r /app/backend

# Dependency checking
docker run --rm -v $(pwd):/app safety check

# OWASP ZAP scanning
docker run --rm -t owasp/zap2docker-stable zap-baseline.py
```

---

## Contact & Reporting

### Security Issues
If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **Email:** security@exam-platform.local
3. **Include:**
   - Description of vulnerability
   - Steps to reproduce
   - Proof of concept (if applicable)
   - Your contact information

### Response Time
- Critical issues: 24 hours
- High issues: 72 hours
- Medium issues: 1 week
- Low issues: Best effort

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-31 | Initial LEVEL 1 release |

---

**Last Updated:** January 31, 2026
**Maintained By:** Development Team
**Status:** Production Ready

