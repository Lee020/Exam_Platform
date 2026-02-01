#!/bin/bash

# Configuration
BACKUP_DIR="/home/sandeep/pavan/Exam_Platform/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/exam_db_backup_$TIMESTAMP.sql"

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "=============================================="
echo "      DATABASE BACKUP IN PROGRESS             "
echo "=============================================="
echo "Target: $BACKUP_FILE"

# Run pg_dump inside the postgres container
sudo docker exec exam_postgres pg_dump -U exam_user exam_db > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful!"
    echo "File location: $BACKUP_FILE"
    # Keeping only the last 7 backups to save space
    ls -t "$BACKUP_DIR"/exam_db_backup_*.sql | tail -n +8 | xargs -I {} rm -- {}
else
    echo "Backup FAILED!"
    exit 1
fi
echo "=============================================="
