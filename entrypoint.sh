#!/bin/sh

# Exit on error
set -e

echo "Waiting for database..."
while ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; do
  sleep 1
done

echo "Database is ready!"

# Apply migrations
echo "Applying migrations..."
python manage.py migrate --noinput

# Initialize admin
echo "Initializing admin..."
python manage.py initadmin

# Start Gunicorn
echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --access-logfile - \
    --error-logfile -
