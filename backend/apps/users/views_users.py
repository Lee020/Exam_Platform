"""
User Management API Views
Handles user profile, listing, and basic user operations
"""
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import User, AuditLog
from .serializers import UserSerializer, ProfileSerializer, UserManagementSerializer
from .permissions import IsAdmin, IsAdminOrInstructor, IsAdminOrSelf


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Get Current User Profile
    GET /api/users/profile/
    
    Requires: Authorization: Bearer <access_token>
    
    Response:
    {
        "status": "success",
        "user": {...}
    }
    """
    serializer = ProfileSerializer(request.user)
    return Response({
        'status': 'success',
        'user': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminOrInstructor])
def list_users_view(request):
    """
    List All Users (Admin/Instructor)
    GET /api/users/
    
    Requires: Authorization: Bearer <access_token>
    Requires: Role = ADMIN or INSTRUCTOR
    
    Response:
    {
        "status": "success",
        "count": 10,
        "next": null,
        "previous": null,
        "results": [...]
    }
    """
    queryset = User.objects.all().select_related('role')

    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 20
    paginated_queryset = paginator.paginate_queryset(queryset, request)

    serializer = UserSerializer(paginated_queryset, many=True)

    return Response({
        'status': 'success',
        'count': paginator.page.paginator.count,
        'next': paginator.get_next_link(),
        'previous': paginator.get_previous_link(),
        'results': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail_view(request, user_id):
    """
    Get User Details (Admin or Self Only)
    GET /api/users/{user_id}/
    
    Requires: Authorization: Bearer <access_token>
    Requires: Admin or requesting own profile
    
    Response:
    {
        "status": "success",
        "user": {...}
    }
    """
    try:
        user = User.objects.select_related('role').get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check permissions
    if not request.user.is_admin and request.user.id != user.id:
        return Response({
            'status': 'error',
            'message': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user)
    return Response({
        'status': 'success',
        'user': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_view(request, user_id):
    """
    Update User (Admin or Self)
    PATCH /api/users/{user_id}/
    
    Requires: Authorization: Bearer <access_token>
    Requires: Admin or updating own profile
    
    Body:
    {
        "role_id": "ADMIN",  // Admin only
        "is_active": true    // Admin only
    }
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check permissions
    if not request.user.is_admin and request.user.id != user.id:
        return Response({
            'status': 'error',
            'message': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)

    # Only admin can change role and active status
    if not request.user.is_admin:
        request.data.pop('role_id', None)
        request.data.pop('is_active', None)

    serializer = UserManagementSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'status': 'success',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)

    return Response({
        'status': 'error',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdmin])
def delete_user_view(request, user_id):
    """
    Delete User (Admin Only)
    DELETE /api/users/{user_id}/
    
    Requires: Authorization: Bearer <access_token>
    Requires: Role = ADMIN
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Prevent self-deletion
    if user.id == request.user.id:
        return Response({
            'status': 'error',
            'message': 'Cannot delete your own account'
        }, status=status.HTTP_400_BAD_REQUEST)

    user.delete()
    return Response({
        'status': 'success',
        'message': 'User deleted successfully'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdmin])
def platform_stats_view(request):
    """
    Get Platform Statistics (Admin Only)
    GET /api/users/stats/
    
    Returns overall platform metrics
    """
    from apps.exams.models import Exam
    from apps.attempts.models import Attempt
    
    total_users = User.objects.count()
    total_exams = Exam.objects.count()
    total_attempts = Attempt.objects.count()
    
    return Response({
        'status': 'success',
        'total_users': total_users,
        'total_exams': total_exams,
        'total_attempts': total_attempts,
        'system_status': 'HEALTHY'
    }, status=status.HTTP_200_OK)


class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related('role')
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdmin]

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        
        # Audit log for role/status changes
        old_role = instance.role.name if instance.role else None
        old_status = instance.is_active
        
        instance = serializer.save()
        
        details = {}
        if old_role and instance.role and old_role != instance.role.name:
            details['role_change'] = f"{old_role} -> {instance.role.name}"
        if old_status != instance.is_active:
            details['status_change'] = f"{old_status} -> {instance.is_active}"
            
        if details:
            AuditLog.objects.create(
                user=user,
                action='UPDATE_USER',
                resource='USER',
                resource_id=str(instance.id),
                details=details,
                ip_address=self.request.META.get('REMOTE_ADDR')
            )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user=self.request.user,
            action='DELETE_USER',
            resource='USER',
            resource_id=str(instance.id),
            details={'username': instance.username},
            ip_address=self.request.META.get('REMOTE_ADDR')
        )
        instance.delete()
