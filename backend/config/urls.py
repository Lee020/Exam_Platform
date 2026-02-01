"""
URL configuration for exam platform
"""
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls_auth')),
    path('api/users/', include('apps.users.urls_users')),
    path('api/', include('apps.question_bank.urls')),
    path('api/', include('apps.exams.urls')),
    path('api/', include('apps.attempts.urls')),
    path('health/', TemplateView.as_view(template_name='health.html')),
]

from django.urls import re_path
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
