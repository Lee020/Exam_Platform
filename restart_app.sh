#!/bin/bash

# Stop on first error
set -e

echo "=============================================="
echo "      Restarting Exam Platform (Safe)       "
echo "=============================================="
echo ""
echo "NOTE: You may be asked for your sudo password."
echo ""

# 1. Stop existing containers (Persists data volumes)
echo "[1/3] Stopping services..."
sudo docker-compose down

# 2. Rebuild and start containers
echo "[2/3] Rebuilding and starting services..."
sudo docker-compose up --build -d

# 3. Check status
echo "[3/3] Checking service status..."
sudo docker-compose ps

echo ""
echo "=============================================="
echo "           Deployment Complete!               "
echo "=============================================="
echo ""
echo "Verify functionality at:"
echo "  Frontend: http://localhost:4200"
echo "  Backend:  http://localhost:8000"
echo ""
