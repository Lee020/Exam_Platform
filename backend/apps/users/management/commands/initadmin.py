import os
from django.core.management.base import BaseCommand
from apps.users.models import User, Role

class Command(BaseCommand):
    help = 'Initializes an admin user if none exists'

    def handle(self, *args, **options):
        # Ensure Roles exist (though User model manager does this, it's good to be explicit)
        admin_role, _ = Role.objects.get_or_create(
            name='ADMIN',
            defaults={'description': 'Administrator role'}
        )
        
        username = os.getenv('ADMIN_USERNAME', 'admin')
        email = os.getenv('ADMIN_EMAIL', 'admin@examplatform.local')
        password = os.getenv('ADMIN_PASSWORD', 'admin123')

        if not User.objects.filter(is_admin=True).exists():
            self.stdout.write('Creating initial admin user...')
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(f'Successfully created admin: {username}')
        else:
            self.stdout.write('Admin user already exists.')
