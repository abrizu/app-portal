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
    
    Tables:
        - applications: Core table tracking every job application.
    """
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

    conn.commit()
    cur.close()
    conn.close()


def get_cursor(conn):
    """Return a cursor for the connection."""
    return conn.cursor()

