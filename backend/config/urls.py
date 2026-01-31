"""
URL configuration for exam platform
"""
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('api/auth/', include('apps.users.urls_auth')),
    path('api/users/', include('apps.users.urls_users')),
    path('health/', TemplateView.as_view(template_name='health.html')),
]
