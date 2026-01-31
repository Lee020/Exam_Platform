from django.urls import path
from .views_auth import (
    register_view, login_view, logout_view,
    refresh_token_view, verify_token_view
)

urlpatterns = [
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('refresh/', refresh_token_view, name='refresh_token'),
    path('verify/', verify_token_view, name='verify_token'),
]
