from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.core.validators import EmailValidator
import uuid


class Role(models.Model):
    """
    Role model for RBAC - LEVEL 1 has three roles: ADMIN, INSTRUCTOR, STUDENT
    """
    ROLE_CHOICES = [
        ('ADMIN', 'Administrator'),
        ('INSTRUCTOR', 'Instructor'),
        ('STUDENT', 'Student'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = 'roles'


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication"""

    def create_user(self, username, email, password=None, role=None):
        """Create and save a regular user"""
        if not username:
            raise ValueError('Username is required')
        if not email:
            raise ValueError('Email is required')

        user = self.model(
            username=username,
            email=self.normalize_email(email),
            role=role or self._get_default_role()
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None):
        """Create and save a superuser"""
        admin_role = self._get_admin_role()
        user = self.create_user(
            username=username,
            email=email,
            password=password,
            role=admin_role
        )
        user.is_admin = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

    def _get_default_role(self):
        """Get or create the default STUDENT role"""
        role, _ = Role.objects.get_or_create(
            name='STUDENT',
            defaults={'description': 'Student user role'}
        )
        return role

    def _get_admin_role(self):
        """Get or create the ADMIN role"""
        role, _ = Role.objects.get_or_create(
            name='ADMIN',
            defaults={'description': 'Administrator role'}
        )
        return role


class User(AbstractBaseUser):
    """
    Custom User model with role-based access control
    Stores all users in PostgreSQL with Django's built-in password hashing
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(
        unique=True,
        validators=[EmailValidator()]
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.PROTECT,
        related_name='users'
    )
    is_active = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} ({self.role.name})"

    def get_full_name(self):
        return self.username

    def has_perm(self, perm, obj=None):
        """Check if user has permission"""
        return self.is_admin

    def has_module_perms(self, app_label):
        """Check module permissions"""
        return self.is_admin

    @property
    def is_staff(self):
        # Allow access if user is marked as admin OR has the ADMIN role
        return self.is_admin or (self.role and self.role.name == 'ADMIN')

    @property
    def role_name(self):
        return self.role.name if self.role else ''

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']


class TokenBlacklist(models.Model):
    """
    Token blacklist for logout functionality
    Stores invalidated tokens in PostgreSQL (backed by Redis cache)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blacklisted_tokens')
    token_jti = models.CharField(max_length=500, unique=True)  # JWT ID claim
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Blacklist entry for {self.user.username}"

    class Meta:
        db_table = 'token_blacklist'
        indexes = [
            models.Index(fields=['token_jti']),
            models.Index(fields=['expires_at']),
        ]

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    resource = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
