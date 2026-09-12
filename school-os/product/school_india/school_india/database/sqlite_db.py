"""
Embedded SQLite Database Engine for School OS
Zero-dependency, ACID-compliant local database manager with WAL mode.
Provides full persistence for schools, users, students, fees, attendance, settings, and backups.
"""

import os
import sqlite3
import hashlib
import json
import secrets
from datetime import datetime

DB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data"))
DB_PATH = os.path.join(DB_DIR, "school_erp.db")
SEED_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "tests", "vidyuth_seed_data.json"))


def get_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return hashed, salt

def verify_password(password: str, hashed: str, salt: str) -> bool:
    check_hash, _ = hash_password(password, salt)
    return check_hash == hashed

def initialize_database():
    """Initializes all database tables and indexes if they do not exist."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. School Profile
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS school_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        udise_code TEXT,
        board TEXT NOT NULL,
        affiliation_no TEXT,
        state TEXT,
        city TEXT,
        address TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        principal_name TEXT,
        academic_year TEXT NOT NULL,
        currency TEXT DEFAULT '₹',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 2. System Settings (Gateways, Keys, Rules)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        category TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 3. Users & Authentication
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        assigned_section TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    );
    """)

    # 4. Students
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admission_number TEXT UNIQUE NOT NULL,
        student_name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        section TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        roll_number INTEGER,
        gender TEXT,
        pen_number TEXT,
        apaar_id TEXT,
        guardian_name TEXT,
        guardian_contact TEXT,
        guardian_email TEXT,
        fee_status TEXT DEFAULT 'Pending',
        outstanding_amount REAL DEFAULT 0.0,
        bus_route TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 5. Attendance Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        class_name TEXT NOT NULL,
        section TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        marked_by TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
    """)

    # 6. Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        username TEXT,
        role TEXT,
        action TEXT NOT NULL,
        details TEXT
    );
    """)

    # 7. Fee Receipts Ledger
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fee_receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_number TEXT UNIQUE NOT NULL,
        admission_number TEXT NOT NULL,
        student_name TEXT NOT NULL,
        amount_paid REAL NOT NULL,
        remaining_balance REAL NOT NULL,
        payment_mode TEXT NOT NULL,
        reference_no TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # 8. Examination Marks Records
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS marks_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        examination TEXT NOT NULL,
        class_name TEXT NOT NULL,
        section TEXT NOT NULL,
        subject TEXT NOT NULL,
        student_id INTEGER NOT NULL,
        admission_number TEXT NOT NULL,
        student_name TEXT NOT NULL,
        marks_obtained REAL NOT NULL,
        max_marks REAL NOT NULL DEFAULT 100,
        grade TEXT,
        marked_by TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(examination, subject, admission_number)
    );
    """)

    conn.commit()

    # Seed if tables are empty
    _seed_defaults_if_empty(conn)
    conn.close()

def _seed_defaults_if_empty(conn):
    cursor = conn.cursor()
    
    # Check if school profile exists
    cursor.execute("SELECT COUNT(*) FROM school_profile;")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO school_profile (name, udise_code, board, affiliation_no, state, city, address, principal_name, academic_year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            "Vidyuth International School",
            "36190500124",
            "CBSE",
            "3630142",
            "Telangana",
            "Hyderabad",
            "Plot 42, Knowledge Corridor, Financial District, Hyderabad, Telangana - 500032",
            "Dr. Radhika Sharma",
            "2026-27",
            now,
            now
        ))

    # Check if default users exist
    cursor.execute("SELECT COUNT(*) FROM users;")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        default_users = [
            ("admin", "admin123", "Admin", "Dr. Radhika Sharma (Principal)", "principal@vidyuthschool.edu.in", "+91 98490 00001", "All"),
            ("teacher", "teacher123", "Teacher", "Aditya Mehta (Grade 10 Lead)", "aditya.mehta@vidyuthschool.edu.in", "+91 98490 21857", "Grade 10A"),
            ("parent", "parent123", "Parent", "Mr. Rajesh Mehta (Aarav's Guardian)", "rajesh.mehta@example.com", "+91 98490 99999", "Grade 8A"),
            ("accountant", "account123", "Accountant", "S. Venkat Rao (Accounts Desk)", "accounts@vidyuthschool.edu.in", "+91 98490 88888", "Accounts"),
        ]
        for uname, pwd, role, fname, email, phone, sec in default_users:
            phash, salt = hash_password(pwd)
            cursor.execute("""
            INSERT INTO users (username, password_hash, salt, role, full_name, email, phone, assigned_section, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (uname, phash, salt, role, fname, email, phone, sec, now))

    # Check if system settings exist
    cursor.execute("SELECT COUNT(*) FROM system_settings;")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        defaults = [
            ("razorpay_key_id", "rzp_test_school_sample_key", "payment"),
            ("razorpay_key_secret", "", "payment"),
            ("school_upi_id", "vidyuth.fees@icici", "payment"),
            ("sms_provider", "Fast2SMS", "communication"),
            ("sms_api_key", "", "communication"),
            ("sms_sender_id", "VIDYUT", "communication"),
            ("whatsapp_cloud_token", "", "communication"),
            ("whatsapp_phone_number_id", "", "communication"),
            ("passing_threshold_pct", "33", "examination"),
            ("grading_scale", "CBSE_9_POINT", "examination"),
            ("grace_marks_max", "5", "examination"),
            ("auto_backup_enabled", "true", "backup")
        ]
        for k, v, cat in defaults:
            cursor.execute("INSERT OR REPLACE INTO system_settings (key, value, category, updated_at) VALUES (?, ?, ?, ?);", (k, v, cat, now))

    # Check if students exist; if not, seed from seed file
    cursor.execute("SELECT COUNT(*) FROM students;")
    if cursor.fetchone()[0] == 0 and os.path.exists(SEED_DATA_PATH):
        try:
            with open(SEED_DATA_PATH, "r", encoding="utf-8") as f:
                seed = json.load(f)
            now = datetime.now().isoformat()
            students_list = seed.get("students", [])
            for s in students_list:
                cursor.execute("""
                INSERT OR IGNORE INTO students (
                    admission_number, student_name, class_name, section, academic_year,
                    pen_number, apaar_id, guardian_name, guardian_contact, fee_status,
                    outstanding_amount, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    s.get("admission_number"),
                    s.get("student_name"),
                    s.get("class"),
                    s.get("section"),
                    s.get("academic_year", "2026-27"),
                    s.get("pen_number"),
                    s.get("apaar_id"),
                    s.get("guardian_name"),
                    s.get("guardian_contact"),
                    s.get("fee_status", "Pending"),
                    float(s.get("outstanding_amount", 0.0)),
                    now
                ))
        except Exception as e:
            print(f"[WARN] Error seeding students from JSON: {e}")

    # Check if fee_receipts exist; if not seed a few samples
    cursor.execute("SELECT COUNT(*) FROM fee_receipts;")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        sample_receipts = [
            ("REC/20260912/0001", "VIS-2026-0001", "Myra Das", 14000.0, 0.0, "UPI / Online", "UPI-918237192", now),
            ("REC/20260912/0002", "VIS-2026-0002", "Pooja Patel", 25000.0, 0.0, "Razorpay", "RZP-881293012", now),
            ("REC/20260912/0048", "VIS-2026-0048", "Aarav Mehta", 18500.0, 0.0, "NetBanking/NEFT", "NEFT-771239102", now),
        ]
        for rno, adm, sname, amt, rem, mode, ref, dt in sample_receipts:
            cursor.execute("""
            INSERT OR IGNORE INTO fee_receipts (receipt_number, admission_number, student_name, amount_paid, remaining_balance, payment_mode, reference_no, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (rno, adm, sname, amt, rem, mode, ref, dt))

    # Check if marks_records exist; if not seed sample marks for Grade 10A Mathematics
    cursor.execute("SELECT COUNT(*) FROM marks_records;")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().isoformat()
        sample_marks = [
            ("PT1", "Grade 10", "A", "Mathematics", 1, "VIS-2026-0001", "Myra Das", 92.0, 100.0, "A1", "Aditya Mehta", now),
            ("PT1", "Grade 10", "A", "Mathematics", 2, "VIS-2026-0002", "Pooja Patel", 85.0, 100.0, "A2", "Aditya Mehta", now),
            ("PT1", "Grade 10", "A", "Mathematics", 3, "VIS-2026-0003", "Reyansh Sharma", 78.0, 100.0, "B1", "Aditya Mehta", now),
            ("PT1", "Grade 10", "A", "Mathematics", 4, "VIS-2026-0004", "Sai Prasad", 65.0, 100.0, "B2", "Aditya Mehta", now),
            ("PT1", "Grade 10", "A", "Mathematics", 5, "VIS-2026-0005", "Varun Prasad", 88.0, 100.0, "A2", "Aditya Mehta", now),
            ("PT1", "Grade 10", "A", "Mathematics", 48, "VIS-2026-0048", "Aarav Mehta", 95.0, 100.0, "A1", "Aditya Mehta", now),
        ]
        for exam, cls, sec, subj, sid, adm, sname, obt, mx, grd, tchr, dt in sample_marks:
            cursor.execute("""
            INSERT OR IGNORE INTO marks_records (examination, class_name, section, subject, student_id, admission_number, student_name, marks_obtained, max_marks, grade, marked_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (exam, cls, sec, subj, sid, adm, sname, obt, mx, grd, tchr, dt))

    conn.commit()

# Run initialization on import if DB doesn't exist
if not os.path.exists(DB_PATH):
    initialize_database()
