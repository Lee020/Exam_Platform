from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Role

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Determine the fields to display in the list view
    list_display = ('username', 'email', 'role', 'is_active', 'is_admin', 'created_at')
    list_filter = ('role', 'is_active', 'is_admin')
    search_fields = ('username', 'email')
    ordering = ('-created_at',)

    # Custom Fieldsets to HIDE 'groups' and 'user_permissions'
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('email',)}),
        ('Permissions', {'fields': ('is_active', 'is_admin', 'is_superuser', 'role')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    
    # Also for the "Add User" form
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password', 'role'),
        }),
    )

    filter_horizontal = () # Remove the filter horizontal cache for perms since we removed them
