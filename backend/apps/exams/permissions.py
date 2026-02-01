from rest_framework import permissions

class IsExamOwnerOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to allow:
    - All Admins and Instructors can create/edit/delete any exam
    - Students can only read
    """

    def has_permission(self, request, view):
        # Read permissions for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions for Admin and Instructor
        user = request.user
        if hasattr(user, 'role_name'):
            return user.role_name in ['ADMIN', 'INSTRUCTOR']
        return False

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions for Admin and Instructor
        user = request.user
        if hasattr(user, 'role_name'):
            return user.role_name in ['ADMIN', 'INSTRUCTOR']
        return False
