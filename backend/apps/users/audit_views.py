from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, AuditLog
from apps.exams.models import Exam
from apps.attempts.models import Attempt
from django.utils import timezone
from datetime import timedelta
from django.db import models
from .permissions import IsAdmin, IsAdminOrInstructor

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing Audit Logs, restricted to Administrators.
    """
    queryset = AuditLog.objects.all().select_related('user')
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get_serializer_class(self):
        # We can define a simple serializer here or import one
        from rest_framework import serializers
        class AuditLogSerializer(serializers.ModelSerializer):
            username = serializers.CharField(source='user.username', read_only=True)
            class Meta:
                model = AuditLog
                fields = ['id', 'username', 'action', 'resource', 'resource_id', 'timestamp', 'details', 'ip_address']
        return AuditLogSerializer

class PlatformStatsViewSet(viewsets.ViewSet):
    """
    ViewSet for platform-wide statistics, restricted to Administrators.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrInstructor]

    def list(self, request):
        user = request.user
        now = timezone.now()
        last_24h = now - timedelta(days=1)
        
        # Admin and Instructor get global stats
        if user.is_admin or (user.role and user.role.name in ['ADMIN', 'INSTRUCTOR']):
            stats = {
                'total_users': User.objects.count(),
                'total_exams': Exam.objects.count(),
                'total_attempts': Attempt.objects.count(),
                'active_exams_24h': Attempt.objects.filter(start_time__gte=last_24h).count(),
                'new_users_24h': User.objects.filter(created_at__gte=last_24h).count(),
                'system_status': 'ONLINE',
                'role_distribution': {
                    'ADMIN': User.objects.filter(role__name='ADMIN').count(),
                    'INSTRUCTOR': User.objects.filter(role__name='INSTRUCTOR').count(),
                    'STUDENT': User.objects.filter(role__name='STUDENT').count(),
                },
                # Extra info for instructors specifically
                'active_students': Attempt.objects.filter(status='STARTED').values('user').distinct().count(),
                'completed_today': Attempt.objects.filter(status='COMPLETED', finish_time__gte=last_24h).count(),
            }
        else:
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        return Response(stats)
