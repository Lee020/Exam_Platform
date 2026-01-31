"""
Custom JWT Authentication and Token Management
Uses PyJWT for token creation/verification
Tokens stored in PostgreSQL blacklist for logout
"""

import jwt
import json
import uuid
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
import redis

from .models import User, TokenBlacklist


class JWTAuthentication(BaseAuthentication):
    """
    JWT authentication using PyJWT
    Tokens validated against blacklist in Redis
    """

    def authenticate(self, request):
        """
        Authenticate request using JWT from Authorization header
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header[7:]  # Remove 'Bearer ' prefix

        try:
            payload = jwt.decode(
                token,
                settings.JWT_CONFIG['SIGNING_KEY'],
                algorithms=[settings.JWT_CONFIG['ALGORITHM']]
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token')

        # Check if token is blacklisted
        if self._is_token_blacklisted(payload.get('jti')):
            raise AuthenticationFailed('Token has been revoked')

        # Get user from token
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')

        if not user.is_active:
            raise AuthenticationFailed('User is inactive')

        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer'

    @staticmethod
    def _is_token_blacklisted(jti):
        """Check if token JTI is in blacklist"""
        if not jti:
            return False

        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True
            )
            # Try Redis first (fast)
            is_blacklisted = r.exists(f'token_blacklist:{jti}')
            return bool(is_blacklisted)
        except redis.ConnectionError:
            # Fall back to database if Redis unavailable
            return TokenBlacklist.objects.filter(token_jti=jti).exists()


class JWTTokenManager:
    """
    Manages JWT token creation, validation, and refresh
    Implements access token + refresh token pattern
    """

    @staticmethod
    def create_tokens(user):
        """
        Create access and refresh tokens for a user
        Returns dict with both tokens and token type
        """
        now = datetime.utcnow()
        jti = str(uuid.uuid4())

        access_payload = {
            'user_id': str(user.id),
            'username': user.username,
            'role': user.role.name,
            'jti': jti,
            'type': 'access',
            'iat': now,
            'exp': now + settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME'],
        }

        refresh_payload = {
            'user_id': str(user.id),
            'jti': jti,
            'type': 'refresh',
            'iat': now,
            'exp': now + settings.JWT_CONFIG['REFRESH_TOKEN_LIFETIME'],
        }

        access_token = jwt.encode(
            access_payload,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithm=settings.JWT_CONFIG['ALGORITHM']
        )

        refresh_token = jwt.encode(
            refresh_payload,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithm=settings.JWT_CONFIG['ALGORITHM']
        )

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': int(settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME'].total_seconds())
        }

    @staticmethod
    def refresh_access_token(refresh_token):
        """
        Create new access token from refresh token
        Validates that refresh token is still valid and not blacklisted
        """
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_CONFIG['SIGNING_KEY'],
                algorithms=[settings.JWT_CONFIG['ALGORITHM']]
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Refresh token has expired')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid refresh token')

        if payload.get('type') != 'refresh':
            raise AuthenticationFailed('Not a refresh token')

        # Check blacklist
        if JWTAuthentication._is_token_blacklisted(payload.get('jti')):
            raise AuthenticationFailed('Refresh token has been revoked')

        # Get user
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found')

        # Create new access token
        now = datetime.utcnow()
        new_jti = str(uuid.uuid4())

        access_payload = {
            'user_id': str(user.id),
            'username': user.username,
            'role': user.role.name,
            'jti': new_jti,
            'type': 'access',
            'iat': now,
            'exp': now + settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME'],
        }

        access_token = jwt.encode(
            access_payload,
            settings.JWT_CONFIG['SIGNING_KEY'],
            algorithm=settings.JWT_CONFIG['ALGORITHM']
        )

        return {
            'access_token': access_token,
            'token_type': 'Bearer',
            'expires_in': int(settings.JWT_CONFIG['ACCESS_TOKEN_LIFETIME'].total_seconds())
        }

    @staticmethod
    def revoke_tokens(token_jti, user, expiry_time):
        """
        Revoke tokens by adding to blacklist
        Used on logout
        """
        # Add to Redis for fast lookup
        try:
            r = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True
            )
            ttl = int((expiry_time - datetime.utcnow()).total_seconds())
            if ttl > 0:
                r.setex(f'token_blacklist:{token_jti}', ttl, '1')
        except redis.ConnectionError:
            pass  # Continue even if Redis fails

        # Also store in database for persistence
        TokenBlacklist.objects.create(
            user=user,
            token_jti=token_jti,
            expires_at=expiry_time
        )
