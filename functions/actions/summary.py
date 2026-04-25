"""
summary.py - Print a quick summary / stats dashboard.
"""

from rich.table import Table
from rich.panel import Panel
from rich import box

from functions.core.db import get_connection, get_cursor
from functions.core.config import console


def show_summary():
    """Print a quick summary / stats dashboard."""
    conn = get_connection()
    cur = get_cursor(conn)

    cur.execute("SELECT COUNT(*) AS total FROM applications;")
    total = cur.fetchone()["total"]

    cur.execute("SELECT status, COUNT(*) AS cnt FROM applications GROUP BY status ORDER BY cnt DESC;")
    statuses = cur.fetchall()

    cur.execute("""
        SELECT company_name, COUNT(*) AS cnt
        FROM applications GROUP BY company_name ORDER BY cnt DESC LIMIT 5;
    """)
    top_companies = cur.fetchall()

    cur.close()
    conn.close()

    console.print(Panel(f"[bold]Total Applications:[/bold] {total}", title="Summary", border_style="magenta"))

    if statuses:
        st = Table(title="By Status", box=box.SIMPLE)
        st.add_column("Status")
        st.add_column("Count", justify="right")
        for s in statuses:
            st.add_row(s["status"], str(s["cnt"]))
        console.print(st)

    if top_companies:
        ct = Table(title="Top Companies", box=box.SIMPLE)
        ct.add_column("Company")
        ct.add_column("Apps", justify="right")
        for c in top_companies:
            ct.add_row(c["company_name"], str(c["cnt"]))
        console.print(ct)
    console.print()
