"""
Permission classes for RBAC
Implements role-based access control at API level
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only ADMIN users can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role.name == 'ADMIN'


class IsInstructor(BasePermission):
    """Only INSTRUCTOR users can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role.name == 'INSTRUCTOR'


class IsStudent(BasePermission):
    """Only STUDENT users can access"""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role.name == 'STUDENT'


class IsAdminOrInstructor(BasePermission):
    """ADMIN or INSTRUCTOR can access"""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role.name in ['ADMIN', 'INSTRUCTOR']


class IsAdminOrSelf(BasePermission):
    """
    ADMIN can access anything, users can access their own data
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role.name == 'ADMIN':
            return True
        return obj.id == request.user.id
