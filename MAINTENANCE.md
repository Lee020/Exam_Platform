# Maintenance & Migration Guide

This document outlines simple steps to manage, backup, and migrate your Exam Platform.

---

## 1. Safety & Backups
Always keep a backup of your data before making major changes.

### **Manual Backup**
To create a current snapshot of your database:
```bash
./backup_db.sh
```
*Files are saved in the `backups/` folder with a timestamp.*

---

## 2. Exporting Data (to Excel)
To get all your data (Students, Exams, Results) in a format you can open in Excel:
```bash
python3 export_data_to_csv.py
```
*CSV files will be created in the `exports/` folder.*

---

## 3. Clearing/Resetting Data
To delete everything and start with a fresh system:
```bash
./reset_db.sh
```
*This will delete all users and exams. It restores the default admin (`admin` / `admin123`).*

---

## 4. Packing & Migration (To New System)
To move this application to a completely different server:

### **Step A: Pack the App**
Build the unified production image on your current system:
```bash
sudo docker build -t exam-platform-unified -f Dockerfile.unified .
```

### **Step B: Export Database**
Run a backup to get a SQL file:
```bash
./backup_db.sh
```

### **Step C: Move to New System**
Copy these items to the new server:
1.  The `exam_db_backup_XXXX.sql` file.
2.  The `.env` file.
3.  The `docker-compose.yml` file.

### **Step D: Start on New System**
On the new server:
1.  Run `sudo docker-compose up -d`
2.  Restore the backup:
    ```bash
    cat exam_db_backup_XXXX.sql | sudo docker exec -i exam_postgres psql -U exam_user -d exam_db
    ```

---

## 5. Summary of Scripts
| Script | Purpose |
| :--- | :--- |
| `./restart_app.sh` | Safely restarts services (Keeps data) |
| `./backup_db.sh` | Creates a database safety snapshot |
| `./reset_db.sh` | Wipes all data (DANGER) |
| `export_data_to_csv.py` | Exports results to Excel/CSV |
