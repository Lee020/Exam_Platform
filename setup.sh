#!/bin/bash

# LEVEL 1 Exam Platform - Local Setup Script

set -e

echo "=========================================="
echo "LEVEL 1 - Online Exam Platform"
echo "Local Deployment Setup"
echo "=========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✓ Docker is installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker Compose is installed"

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "✓ .env created (default values safe for local development)"
fi

# Create directory structure
echo "📁 Setting up directory structure..."

mkdir -p backend/apps/users/migrations
mkdir -p backend/templates
mkdir -p frontend/src/app/{auth,dashboard}
mkdir -p frontend/src/environments

echo "✓ Directories created"

# Build and start services
echo ""
echo "🐳 Starting Docker containers..."
echo "(This may take a few minutes on first run)"
echo ""

docker-compose build
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check if backend is ready
if docker exec exam_backend python manage.py migrate 2>/dev/null; then
    echo "✓ Database migrations completed"
else
    echo "⚠️ Migrations may still be running..."
fi

echo ""
echo "=========================================="
echo "✅ LEVEL 1 Platform is ready!"
echo "=========================================="
echo ""
echo "📡 Services running:"
echo "   Backend API:  http://localhost:8000/api/"
echo "   Frontend:     http://localhost:4200"
echo "   PostgreSQL:   localhost:5432"
echo "   Redis:        localhost:6379"
echo ""
echo "🧪 Test the API:"
echo ""
echo "1️⃣  Register a new user:"
echo "   curl -X POST http://localhost:8000/api/auth/register/ \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"username\": \"testuser\", \"email\": \"test@local.dev\", \"password\": \"testpass123\", \"password_confirm\": \"testpass123\", \"role\": \"STUDENT\"}'"
echo ""
echo "2️⃣  Login:"
echo "   curl -X POST http://localhost:8000/api/auth/login/ \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"username\": \"testuser\", \"password\": \"testpass123\"}'"
echo ""
echo "3️⃣  Access your profile (use access_token from login response):"
echo "   curl http://localhost:8000/api/users/profile/ \\"
echo "     -H \"Authorization: Bearer <access_token>\""
echo ""
echo "📚 View logs:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo "🛑 Stop services:"
echo "   docker-compose down"
echo ""
echo "🧹 Reset (WARNING: deletes data):"
echo "   docker-compose down -v"
echo ""
