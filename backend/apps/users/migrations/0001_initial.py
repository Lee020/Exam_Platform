from django.db import migrations, models
import django.db.models.deletion
import uuid


def create_default_roles(apps, schema_editor):
    """Create default roles for LEVEL 1"""
    Role = apps.get_model('users', 'Role')
    roles = [
        ('ADMIN', 'Administrator with full system access'),
        ('INSTRUCTOR', 'Instructor who can create and manage exams'),
        ('STUDENT', 'Student who takes exams'),
    ]

    for role_name, description in roles:
        Role.objects.get_or_create(
            name=role_name,
            defaults={
                'id': str(uuid.uuid4()),
                'description': description
            }
        )


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('name', models.CharField(
                    choices=[('ADMIN', 'Administrator'), ('INSTRUCTOR', 'Instructor'), ('STUDENT', 'Student')],
                    max_length=20,
                    unique=True
                )),
                ('description', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'roles',
            },
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('username', models.CharField(max_length=150, unique=True)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_admin', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='users', to='users.role')),
            ],
            options={
                'db_table': 'users',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TokenBlacklist',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('token_jti', models.CharField(max_length=500, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='blacklisted_tokens', to='users.user')),
            ],
            options={
                'db_table': 'token_blacklist',
            },
        ),
        migrations.RunPython(create_default_roles),
    ]
