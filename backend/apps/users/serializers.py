"""
Serializers for User and Authentication
"""
from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    """Serialize role information"""
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    """
    User serializer for API responses
    Role is read-only (assigned during registration)
    """
    role = RoleSerializer(read_only=True)
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'role_name',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']


class RegisterSerializer(serializers.ModelSerializer):
    """
    User registration serializer
    Validates user input and creates new user
    """
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text="Password must be at least 8 characters"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
        help_text="Confirm password"
    )
    role = serializers.ChoiceField(
        choices=[('ADMIN', 'Administrator'), ('INSTRUCTOR', 'Instructor'), ('STUDENT', 'Student')],
        default='STUDENT'
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'role']

    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match'})
        return attrs

    def validate_username(self, value):
        """Check username uniqueness and format"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already exists')
        if not value.isalnum() and '_' not in value:
            raise serializers.ValidationError('Username can only contain alphanumeric characters and underscores')
        return value

    def validate_email(self, value):
        """Check email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value

    def create(self, validated_data):
        """Create user with hashed password"""
        role_name = validated_data.pop('role')
        role = Role.objects.get(name=role_name)

        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            role=role
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """
    Login serializer
    Accepts username and password, returns tokens
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RefreshTokenSerializer(serializers.Serializer):
    """
    Refresh token serializer
    Takes refresh token, returns new access token
    """
    refresh_token = serializers.CharField()


class LogoutSerializer(serializers.Serializer):
    """
    Logout serializer
    Takes access token to invalidate
    """
    access_token = serializers.CharField()


class TokenResponseSerializer(serializers.Serializer):
    """
    Response serializer for token endpoints
    Returns access token, refresh token, and user info
    """
    access_token = serializers.CharField()
    refresh_token = serializers.CharField(required=False)
    token_type = serializers.CharField(default='Bearer')
    expires_in = serializers.IntegerField()
    user = UserSerializer(required=False)


class ProfileSerializer(serializers.ModelSerializer):
    """User profile serializer with full details"""
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'role_name',
            'is_active', 'is_admin', 'created_at', 'updated_at', 'last_login'
        ]
        read_only_fields = ['id', 'is_active', 'is_admin', 'created_at', 'updated_at', 'last_login']
