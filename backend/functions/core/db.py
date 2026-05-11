import sqlite3
from pathlib import Path

# The database file will be created in the databases folder in the project root
DB_PATH = Path(__file__).parent.parent.parent / "databases" / "app_portal.db"


def get_connection():
    """Return a new sqlite3 connection using the local file."""
    conn = sqlite3.connect(str(DB_PATH))
    # Configure the connection to return dictionary-like objects
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    """
    Create all tables if they don't already exist.
    """
    # Ensure the parent directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS applications (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            job_title       VARCHAR(255) NOT NULL,
            company_name    VARCHAR(255) NOT NULL,
            posting_date    DATE,
            application_date DATE NOT NULL DEFAULT CURRENT_DATE,
            status          VARCHAR(50)  NOT NULL DEFAULT 'Applied',
            technologies    TEXT,
            posting_url     TEXT,
            location        VARCHAR(255),
            job_type        VARCHAR(50),
            salary_range    VARCHAR(100),
            source          VARCHAR(100),
            resume_used     VARCHAR(255),
            notes           TEXT,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS drafts (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            job_title       VARCHAR(255),
            company_name    VARCHAR(255),
            posting_date    DATE,
            application_date DATE,
            status          VARCHAR(50)  DEFAULT 'Draft',
            technologies    TEXT,
            posting_url     TEXT,
            location        VARCHAR(255),
            job_type        VARCHAR(50),
            salary_range    VARCHAR(100),
            source          VARCHAR(100),
            resume_used     VARCHAR(255),
            priority_score  INTEGER,
            notes           TEXT,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            username        VARCHAR(50) UNIQUE NOT NULL,
            password_hash   VARCHAR(255) NOT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS resumes (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id         INTEGER,
            filename        VARCHAR(255) NOT NULL,
            file_data       BLOB,
            upload_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, filename)
        );
    """)

    # ── Migration: add priority / attainability columns if missing ──
    cur.execute("PRAGMA table_info(applications);")
    existing_cols = {row["name"] for row in cur.fetchall()}

    if "priority_score" not in existing_cols:
        cur.execute("""
            ALTER TABLE applications
            ADD COLUMN priority_score INTEGER CHECK (priority_score BETWEEN 1 AND 10);
        """)

    if "attainability_score" not in existing_cols:
        cur.execute("""
            ALTER TABLE applications
            ADD COLUMN attainability_score INTEGER CHECK (attainability_score BETWEEN 1 AND 10);
        """)

    if "app_username" not in existing_cols:
        cur.execute("ALTER TABLE applications ADD COLUMN app_username TEXT;")
    if "app_password" not in existing_cols:
        cur.execute("ALTER TABLE applications ADD COLUMN app_password TEXT;")
    if "work_type" not in existing_cols:
        cur.execute("ALTER TABLE applications ADD COLUMN work_type VARCHAR(20);")

    # ── Migration: add credential columns to drafts if missing ──
    cur.execute("PRAGMA table_info(drafts);")
    drafts_cols = {row["name"] for row in cur.fetchall()}

    if "app_username" not in drafts_cols:
        cur.execute("ALTER TABLE drafts ADD COLUMN app_username TEXT;")
    if "app_password" not in drafts_cols:
        cur.execute("ALTER TABLE drafts ADD COLUMN app_password TEXT;")
    if "work_type" not in drafts_cols:
        cur.execute("ALTER TABLE drafts ADD COLUMN work_type VARCHAR(20);")

    # ── Migration: add profile columns to users if missing ──
    cur.execute("PRAGMA table_info(users);")
    users_cols = {row["name"] for row in cur.fetchall()}

    if "first_name" not in users_cols:
        cur.execute("ALTER TABLE users ADD COLUMN first_name VARCHAR(100);")
    if "last_name" not in users_cols:
        cur.execute("ALTER TABLE users ADD COLUMN last_name VARCHAR(100);")
    if "home_location" not in users_cols:
        cur.execute("ALTER TABLE users ADD COLUMN home_location VARCHAR(255);")

    # ── Migration: add user_id and file_data to resumes if missing ──
    cur.execute("PRAGMA table_info(resumes);")
    resumes_cols = {row["name"] for row in cur.fetchall()}

    if "user_id" not in resumes_cols:
        cur.execute("ALTER TABLE resumes ADD COLUMN user_id INTEGER;")
    if "file_data" not in resumes_cols:
        cur.execute("ALTER TABLE resumes ADD COLUMN file_data BLOB;")

    # ── Migrate existing resumes from folder to DB ──
    resumes_dir = DB_PATH.parent.parent / "resumes"
    if resumes_dir.exists():
        cur.execute("SELECT id, filename FROM resumes WHERE file_data IS NULL")
        for row in cur.fetchall():
            file_path = resumes_dir / row["filename"]
            if file_path.exists():
                with open(file_path, "rb") as f:
                    file_data = f.read()
                cur.execute("UPDATE resumes SET file_data = ? WHERE id = ?", (file_data, row["id"]))

    # Also assign existing resumes to the first user if user_id is null
    cur.execute("SELECT id FROM users LIMIT 1")
    user_row = cur.fetchone()
    if user_row:
        default_user_id = user_row["id"]
        cur.execute("UPDATE resumes SET user_id = ? WHERE user_id IS NULL", (default_user_id,))

    conn.commit()
    cur.close()
    conn.close()


def get_cursor(conn):
    """Return a cursor for the connection."""
    return conn.cursor()

