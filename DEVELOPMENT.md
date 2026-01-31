# Development Guide

## Local Development Setup

### Prerequisites
- Docker & Docker Compose
- Git
- (Optional) Python 3.11+ for local debugging
- (Optional) Node.js 20+ for local frontend development

### Quick Start (5 minutes)

```bash
# Clone/enter project
cd /home/vvdn/Documents/test_app

# Copy environment template
cp .env.example .env

# Start all services
docker-compose up -d

# Wait for initialization
sleep 10

# Verify services
docker-compose ps

# Check logs
docker-compose logs backend
docker-compose logs frontend
```

Visit:
- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:8000/api/
- **API Docs:** http://localhost:8000/api/auth/ (in README)

---

## Project Structure

```
test_app/
├── backend/                    # Django REST API
│   ├── manage.py              # Django CLI
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Docker image for backend
│   ├── .dockerignore           # Files to skip in Docker
│   ├── config/
│   │   ├── settings.py         # Django configuration
│   │   ├── urls.py             # URL routing
│   │   └── wsgi.py             # WSGI application
│   └── apps/
│       └── users/              # Auth & user management app
│           ├── models.py       # User, Role, TokenBlacklist
│           ├── views_auth.py   # Auth endpoints
│           ├── views_users.py  # User endpoints
│           ├── authentication.py # JWT implementation
│           ├── permissions.py  # RBAC decorators
│           ├── serializers.py  # API serialization
│           ├── urls_auth.py    # Auth routes
│           ├── urls_users.py   # User routes
│           └── migrations/     # Database migrations
│
├── frontend/                   # Angular Application
│   ├── package.json           # Node dependencies
│   ├── angular.json           # Angular config
│   ├── tsconfig.json          # TypeScript config
│   ├── Dockerfile             # Docker image for frontend
│   ├── .dockerignore           # Files to skip
│   └── src/
│       ├── index.html         # HTML entry point
│       ├── main.ts            # Angular bootstrap
│       └── app/
│           ├── app.module.ts  # Root module
│           ├── app.component.ts # Root component
│           ├── app-routing.module.ts # Routes
│           ├── dashboard/     # Main dashboard
│           │   └── dashboard.component.ts
│           └── auth/          # Authentication module
│               ├── auth.module.ts
│               ├── services/
│               │   └── auth.service.ts
│               ├── guards/
│               │   └── auth.guard.ts
│               ├── interceptors/
│               │   └── auth.interceptor.ts
│               └── components/
│                   ├── login.component.ts
│                   └── register.component.ts
│
├── docker-compose.yml          # Service orchestration
├── .env.example               # Environment template
├── setup.sh                   # Setup script
├── README.md                  # Project overview
├── API_DOCS.md                # API documentation
├── ARCHITECTURE.md            # Design decisions
├── TROUBLESHOOTING.md         # Common issues
└── DEVELOPMENT.md             # This file
```

---

## Backend Development

### Setting Up Local Python Environment (Optional)

```bash
# Create virtual environment
python3.11 -m venv venv_exam

# Activate
source venv_exam/bin/activate  # Linux/Mac
# or
venv_exam\Scripts\activate     # Windows

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
cd backend
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start dev server
python manage.py runserver
```

### Django Commands Reference

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create migrations
docker-compose exec backend python manage.py makemigrations

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Access Python shell
docker-compose exec backend python manage.py shell

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Load fixtures
docker-compose exec backend python manage.py loaddata fixture.json

# Dump data
docker-compose exec backend python manage.py dumpdata > data.json
```

### Adding a New API Endpoint

1. **Create view function** in `apps/users/views_auth.py` or `apps/users/views_users.py`:

```python
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_view(request):
    """My new endpoint"""
    return Response({
        'status': 'success',
        'data': {}
    })
```

2. **Add to URL routing** in `apps/users/urls_auth.py`:

```python
urlpatterns = [
    path('my-endpoint/', my_view, name='my_endpoint'),
]
```

3. **Test with curl**:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/auth/my-endpoint/
```

### Database Operations

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U exam_user -d exam_db

# Common queries
\dt                    # List tables
\d users              # Describe table
SELECT * FROM users;  # Query users
```

### Debugging

```bash
# View all requests/responses
docker-compose logs -f backend | grep -E "GET|POST|PUT|DELETE"

# Django shell debugging
docker-compose exec backend python manage.py shell
>>> from apps.users.models import User
>>> User.objects.all()
>>> from apps.users.authentication import JWTTokenManager
>>> tokens = JWTTokenManager.create_tokens(user)
```

---

## Frontend Development

### Setting Up Local Node Environment (Optional)

```bash
# Install dependencies
cd frontend
npm install

# Start dev server
ng serve --host 0.0.0.0 --disable-host-check

# Build for production
ng build --configuration production

# Run tests
ng test

# Lint
ng lint
```

### Adding a New Component

```bash
# Generate component
ng generate component my-component

# Generate service
ng generate service services/my-service

# Generate module
ng generate module features/my-feature
```

### File Structure for Features

```
frontend/src/app/
├── auth/                      # Auth feature
│   ├── auth.module.ts         # Feature module
│   ├── auth-routing.module.ts # Feature routes
│   ├── components/            # Components
│   │   ├── login.component.ts
│   │   └── register.component.ts
│   ├── services/              # Services
│   │   └── auth.service.ts
│   ├── guards/                # Route guards
│   │   └── auth.guard.ts
│   └── interceptors/          # HTTP interceptors
│       └── auth.interceptor.ts
│
└── shared/                    # Shared utilities (future)
    ├── models/                # Interfaces/types
    ├── pipes/                 # Custom pipes
    └── directives/            # Custom directives
```

### Key Angular Patterns Used

**Services with Observables:**
```typescript
// auth.service.ts
public isLoggedIn$ = this.isLoggedInSubject.asObservable();

// component.ts
constructor(private authService: AuthService) {}
(authService.isLoggedIn$ | async)
```

**HTTP Interceptor:**
```typescript
// Auto-injects JWT token into every request
export class AuthInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Add token to Authorization header
    return next.handle(request);
  }
}
```

**Route Guards:**
```typescript
// Prevents unauthorized route navigation
export class AuthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.authService.isLoggedIn();
  }
}
```

### Testing Frontend

```bash
# Unit tests
ng test

# E2E tests (if configured)
ng e2e

# Build
ng build

# Serve production build locally
ng serve --configuration production
```

### Debugging Frontend

**Browser DevTools:**
```javascript
// Console
localStorage.getItem('access_token')
sessionStorage.getItem('refresh_token')

// Watch network requests
// Open DevTools > Network tab > filter by "api"
```

**Angular DevTools Chrome Extension:**
- Recommended for component tree inspection
- Time travel debugging

---

## Making Changes

### Backend Changes

1. **Modify code** in `backend/`
2. **Restart backend container:**
```bash
docker-compose restart backend
```

3. **Or rebuild if dependencies changed:**
```bash
docker-compose build backend
docker-compose up -d backend
```

4. **Check logs:**
```bash
docker-compose logs -f backend
```

### Frontend Changes

1. **Modify code** in `frontend/src/`
2. **Frontend auto-reloads** (ng serve watches files)
3. **If stuck, restart:**
```bash
docker-compose restart frontend
```

---

## Testing

### Backend Unit Tests (Future Implementation)

```bash
# Run tests
docker-compose exec backend python manage.py test

# With coverage
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
```

### Frontend Unit Tests (Future Implementation)

```bash
# Run tests
docker-compose exec frontend ng test

# With coverage
docker-compose exec frontend ng test --code-coverage
```

### Manual Testing Checklist

**Authentication:**
- ✅ Register with valid credentials
- ✅ Register with duplicate username (should fail)
- ✅ Register with weak password (should fail)
- ✅ Login with valid credentials
- ✅ Login with invalid credentials (should fail)
- ✅ Logout successfully
- ✅ Access protected route after logout (should redirect)

**RBAC:**
- ✅ Admin can list all users
- ✅ Student cannot list users (403)
- ✅ Student can access own profile
- ✅ Student cannot access other profiles (403)
- ✅ Instructor can view student profiles

**Token Management:**
- ✅ Access token expires after 15 minutes
- ✅ Refresh token works within 7 days
- ✅ Expired refresh token rejected
- ✅ Blacklisted tokens rejected

---

## Code Style & Standards

### Python (Backend)

```bash
# Format code
docker-compose exec backend python -m black .

# Lint
docker-compose exec backend python -m flake8 .

# Type checking (mypy)
docker-compose exec backend mypy .
```

Style Guide: PEP 8

### TypeScript (Frontend)

ESLint configuration in `frontend/.eslintrc.json`

```bash
# Lint
ng lint

# Format
npm run format
```

Style Guide: Google TypeScript Style Guide

---

## Performance Optimization

### Backend

```python
# Use select_related for foreign keys
User.objects.select_related('role')

# Use prefetch_related for reverse relations
User.objects.prefetch_related('blacklisted_tokens')

# Cache frequently accessed data
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # 15 minutes
def get_user_profile(request):
    ...
```

### Frontend

```typescript
// OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Lazy load modules
const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule)
  }
];

// Unsubscribe from observables
ngOnDestroy() {
  this.subscription.unsubscribe();
}
```

---

## Deployment Preparation

### Before Production Deployment

```bash
# 1. Update environment variables
cp .env.example .env
# Edit .env with production values

# 2. Run security checks
docker-compose exec backend python manage.py check --deploy

# 3. Collect static files
docker-compose exec backend python manage.py collectstatic

# 4. Build production frontend
docker-compose exec frontend ng build --configuration production

# 5. Run migrations
docker-compose exec backend python manage.py migrate

# 6. Create backup
docker-compose exec postgres pg_dump -U exam_user exam_db > backup.sql
```

### Configuration Checklist

- [ ] `DEBUG = False` in production
- [ ] Strong `DJANGO_SECRET_KEY` (40+ random chars)
- [ ] Strong `JWT_SECRET_KEY` (40+ random chars)
- [ ] `ALLOWED_HOSTS` set to production domain
- [ ] `CORS_ALLOWED_ORIGINS` set to production frontend URL
- [ ] Database credentials updated
- [ ] Redis configured for production
- [ ] SSL/TLS certificates installed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Logging configured

---

## Useful Resources

- **Django Documentation:** https://docs.djangoproject.com/
- **Django REST Framework:** https://www.django-rest-framework.org/
- **Angular Documentation:** https://angular.io/docs
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Redis Documentation:** https://redis.io/documentation
- **Docker Documentation:** https://docs.docker.com/

---

## Contributing

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat: add password reset functionality

- Add password reset endpoint
- Add email notification
- Add token expiration

Closes #123
```

### Pull Request Process

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push: `git push origin feature/my-feature`
4. Create pull request with description
5. Wait for review and CI checks
6. Merge after approval

---

## What's Next?

See `README.md` for LEVEL 2+ roadmap.

Happy coding! 🚀

