#!/bin/bash

# Stop on first error
set -e

echo "=============================================="
1: echo "      RESETTING DATABASE TO DEFAULT           "
2: echo "=============================================="
3: echo ""
4: echo "WARNING: This will PERMANENTLY DELETE all users, exams, and attempts."
5: echo "Default admin credentials will be restored (admin/admin123)."
6: echo ""
7: read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
8: echo ""
9: if [[ ! $REPLY =~ ^[Yy]$ ]]
10: then
11:     echo "Reset cancelled."
12:     exit 1
13: fi
14: 
15: # 1. Stop existing containers and remove volumes
16: echo "Stopping services and removing volumes..."
17: sudo docker-compose down -v
18: 
19: # 2. Start containers (this triggers migrations and initadmin)
20: echo "Starting services and initializing database..."
21: sudo docker-compose up -d
22: 
23: echo ""
24: echo "Reset Complete!"
25: echo "Default Admin:  admin / admin123"
26: echo "Backend URL:    http://localhost:8000"
27: echo "Frontend URL:   http://localhost:4200"
28: echo ""
