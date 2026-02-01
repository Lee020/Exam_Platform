import os
import csv
import psycopg2
from datetime import datetime

# Configuration from .env or defaults
DB_NAME = os.getenv('DB_NAME', 'exam_db')
DB_USER = os.getenv('DB_USER', 'exam_user')
DB_PASS = os.getenv('DB_PASSWORD', 'exam_password')
DB_HOST = 'localhost' # Use localhost if running outside container, or docker service name if inside
DB_PORT = '5432'

EXPORT_DIR = "/home/sandeep/pavan/Exam_Platform/exports"
os.makedirs(EXPORT_DIR, exist_ok=True)

def export_table(cursor, table_name, query, filename):
    print(f"Exporting {table_name}...")
    cursor.execute(query)
    rows = cursor.fetchall()
    colnames = [desc[0] for desc in cursor.description]
    
    filepath = os.path.join(EXPORT_DIR, filename)
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(colnames)
        writer.writerows(rows)
    print(f"  -> Saved to {filepath}")

def main():
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT
        )
        cur = conn.cursor()

        # 1. Export Students
        export_table(cur, "Students", 
                     "SELECT username, email, created_at FROM users WHERE role_id IN (SELECT id FROM roles WHERE name = 'STUDENT')", 
                     "all_students.csv")

        # 2. Export Exams
        export_table(cur, "Exams", 
                     "SELECT title, duration_minutes, pass_marks, status, created_at FROM ex_exams", 
                     "all_exams.csv")

        # 3. Export Results (Detailed)
        export_table(cur, "Exam Results", 
                     """
                     SELECT 
                        u.username as student_name,
                        e.title as exam_title,
                        a.status,
                        a.score,
                        a.start_time,
                        a.finish_time,
                        a.violation_count
                     FROM att_attempts a
                     JOIN users u ON a.user_id = u.id
                     JOIN ex_exams e ON a.exam_id = e.id
                     ORDER BY a.finish_time DESC
                     """, 
                     "exam_results_all.csv")

        cur.close()
        conn.close()
        print("\nAll exports completed successfully in 'exports/' folder.")
        
    except Exception as e:
        print(f"An error occurred: {e}")
        print("\nTIP: If running outside Docker, ensure Postgres is exposed on port 5432 and you have 'psycopg2' installed.")

if __name__ == "__main__":
    main()
