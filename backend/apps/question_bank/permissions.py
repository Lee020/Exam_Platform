from rest_framework import permissions


class IsAdminOrInstructorOrReadOnly(permissions.BasePermission):
    """Admin: full access; Instructor: CRUD on own objects; Student: read-only published"""

    def has_permission(self, request, view):
        # All endpoints require authentication at higher level; here allow authenticated users
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS allowed for all authenticated users but students only see published via queryset filtering
        if request.method in permissions.SAFE_METHODS:
            return True

        # At this point it's a write operation
        if getattr(request.user, 'is_admin', False):
            return True

        # Instructors can only modify their own questions OR fork published ones
        if hasattr(obj, 'created_by') and obj.created_by_id == request.user.id:
            return True
            
        # Allow editing PUBLISHED questions (Serializer handles versioning/forking)
        if getattr(obj, 'status', '') == 'PUBLISHED':
            return True

        return False
