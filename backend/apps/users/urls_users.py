from django.urls import path
from .views_users import (
    profile_view, list_users_view, user_detail_view, users_by_role_view
)

urlpatterns = [
    path('profile/', profile_view, name='profile'),
    path('', list_users_view, name='list_users'),
    path('<str:user_id>/', user_detail_view, name='user_detail'),
    path('role/<str:role>/', users_by_role_view, name='users_by_role'),
]
