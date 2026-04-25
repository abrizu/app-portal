"""
functions/users/db.py - Database connection and initialization for users.db.
"""

import sqlite3
from pathlib import Path

# Stored alongside app_portal.db in the databases directory
USERS_DB_PATH = Path(__file__).parent.parent.parent / "databases" / "users.db"



def get_users_connection() -> sqlite3.Connection:
    """Return a sqlite3 connection to users.db with row-factory enabled."""
    conn = sqlite3.connect(str(USERS_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def initialize_users_database() -> None:
    """Create all tables in users.db if they do not already exist."""
    conn = get_users_connection()
    cur = conn.cursor()

    # Application credential records — plain text, meant for quick retrieval
    cur.execute("""
        CREATE TABLE IF NOT EXISTS app_users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            app_id      INTEGER NOT NULL,
            username    TEXT    NOT NULL,
            password    TEXT    NOT NULL,
            notes       TEXT,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Master login — bcrypt-hashed, gates access to users.py
    cur.execute("""
        CREATE TABLE IF NOT EXISTS master_auth (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            username    TEXT NOT NULL,
            password    TEXT NOT NULL
        );
    """)

    conn.commit()
    cur.close()
    conn.close()


# ── app_portal.db cross-reference helpers ────────────────────────────────────

_PORTAL_DB_PATH = Path(__file__).parent.parent.parent / "databases" / "app_portal.db"



def get_job_title(app_id: int) -> str | None:
    """
    Return the job_title from app_portal.db for the given app_id,
    or None if the record does not exist.
    """
    if not _PORTAL_DB_PATH.exists():
        return None
    conn = sqlite3.connect(str(_PORTAL_DB_PATH))
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT job_title FROM applications WHERE id = ?;", (app_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return row["job_title"] if row else None
