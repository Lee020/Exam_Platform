"""
User Management API Views
Handles user profile, listing, and basic user operations
"""
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import User
from .serializers import UserSerializer, ProfileSerializer
from .permissions import IsAdmin, IsAdminOrSelf


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
@permission_classes([IsAdmin])
def list_users_view(request):
    """
    List All Users (Admin Only)
    GET /api/users/
    
    Requires: Authorization: Bearer <access_token>
    Requires: Role = ADMIN
    
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
    Requires: Role = ADMIN or viewing own profile
    
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
            'detail': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check permissions
    if request.user.role.name != 'ADMIN' and request.user.id != user.id:
        return Response({
            'status': 'error',
            'detail': 'You do not have permission to view this user'
        }, status=status.HTTP_403_FORBIDDEN)

    serializer = UserSerializer(user)
    return Response({
        'status': 'success',
        'user': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_by_role_view(request, role):
    """
    Get Users by Role (Admin Only)
    GET /api/users/role/{role}/
    
    Requires: Authorization: Bearer <access_token>
    Requires: Role = ADMIN
    
    Valid roles: ADMIN, INSTRUCTOR, STUDENT
    
    Response:
    {
        "status": "success",
        "role": "STUDENT",
        "count": 5,
        "users": [...]
    }
    """
    if request.user.role.name != 'ADMIN':
        return Response({
            'status': 'error',
            'detail': 'Only admins can list users by role'
        }, status=status.HTTP_403_FORBIDDEN)

    valid_roles = ['ADMIN', 'INSTRUCTOR', 'STUDENT']
    if role.upper() not in valid_roles:
        return Response({
            'status': 'error',
            'detail': f'Invalid role. Must be one of: {", ".join(valid_roles)}'
        }, status=status.HTTP_400_BAD_REQUEST)

    queryset = User.objects.filter(role__name=role.upper()).select_related('role')
    serializer = UserSerializer(queryset, many=True)

    return Response({
        'status': 'success',
        'role': role.upper(),
        'count': queryset.count(),
        'users': serializer.data
    }, status=status.HTTP_200_OK)
