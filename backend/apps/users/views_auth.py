"""
Authentication API Views
Handles user registration, login, logout, and token refresh
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
import jwt
from django.conf import settings

from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, RefreshTokenSerializer,
    LogoutSerializer, TokenResponseSerializer, UserSerializer
)
from .authentication import JWTTokenManager


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    User Registration Endpoint
    POST /api/auth/register/
    
    Request:
    {
        "username": "john_doe",
        "email": "john@exam.local",
        "password": "secure_password_123",
        "password_confirm": "secure_password_123",
        "role": "STUDENT"  # ADMIN, INSTRUCTOR, or STUDENT
    }
    
    Response:
    {
        "status": "success",
        "user": {...},
        "message": "User registered successfully"
    }
    """
    serializer = RegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'status': 'success',
            'message': 'User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Login Endpoint
    POST /api/auth/login/
    
    Request:
    {
        "username": "john_doe",
        "password": "secure_password_123"
    }
    
    Response:
    {
        "status": "success",
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "token_type": "Bearer",
        "expires_in": 900,
        "user": {...}
    }
    """
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'detail': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({
            'status': 'error',
            'detail': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_active:
        return Response({
            'status': 'error',
            'detail': 'User account is disabled'
        }, status=status.HTTP_401_UNAUTHORIZED)

    # Update last login
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    # Create tokens
    tokens = JWTTokenManager.create_tokens(user)

    return Response({
        'status': 'success',
        'access_token': tokens['access_token'],
        'refresh_token': tokens['refresh_token'],
        'token_type': tokens['token_type'],
        'expires_in': tokens['expires_in'],
        'user': UserSerializer(user).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout Endpoint
    POST /api/auth/logout/
    
    Requires: Authorization: Bearer <access_token>
    
    Request:
    {}
    
    Response:
    {
        "status": "success",
        "message": "Logged out successfully"
    }
    """
    # Extract token from header
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return Response({
            'status': 'error',
            'detail': 'Invalid authorization header'
        }, status=status.HTTP_400_BAD_REQUEST)

    token = auth_header[7:]

    try:
        payload = jwt.decode(
            token,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithms=[settings.JWT_CONFIG['ALGORITHM']]
        )
    except jwt.InvalidTokenError:
        return Response({
            'status': 'error',
            'detail': 'Invalid token'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Revoke token
    jti = payload.get('jti')
    exp_timestamp = payload.get('exp')

    if exp_timestamp:
        from datetime import datetime
        exp_time = datetime.utcfromtimestamp(exp_timestamp)
        JWTTokenManager.revoke_tokens(jti, request.user, exp_time)

    return Response({
        'status': 'success',
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """
    Refresh Token Endpoint
    POST /api/auth/refresh/
    
    Request:
    {
        "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
    
    Response:
    {
        "status": "success",
        "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
        "token_type": "Bearer",
        "expires_in": 900
    }
    """
    serializer = RefreshTokenSerializer(data=request.data)

    if not serializer.is_valid():
        return Response({
            'status': 'error',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    refresh_token = serializer.validated_data['refresh_token']

    try:
        tokens = JWTTokenManager.refresh_access_token(refresh_token)
        return Response({
            'status': 'success',
            **tokens
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'status': 'error',
            'detail': str(e)
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token_view(request):
    """
    Verify Token Endpoint
    GET /api/auth/verify/
    
    Requires: Authorization: Bearer <access_token>
    
    Response:
    {
        "status": "success",
        "valid": true,
        "user": {...}
    }
    """
    return Response({
        'status': 'success',
        'valid': True,
        'user': UserSerializer(request.user).data
    }, status=status.HTTP_200_OK)
