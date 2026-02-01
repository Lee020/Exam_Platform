from django.urls import path
from rest_framework.routers import DefaultRouter
from .views_users import (
    profile_view, list_users_view, user_detail_view,
    UserManagementViewSet, platform_stats_view
)
from .audit_views import AuditLogViewSet, PlatformStatsViewSet

router = DefaultRouter()
router.register('mgnt', UserManagementViewSet, basename='user-management')
router.register('audit', AuditLogViewSet, basename='audit')
router.register('stats', PlatformStatsViewSet, basename='stats')


urlpatterns = [
    path('profile/', profile_view, name='profile'),
    path('stats/', platform_stats_view, name='platform-stats'),
    path('', list_users_view, name='list_users'),
    path('<str:user_id>/', user_detail_view, name='user_detail'),
] + router.urls
