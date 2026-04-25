"""
functions/users/list_users.py - Display all app_user records (no password shown).
"""

from rich.table import Table
from rich import box

from functions.core.config import console
from functions.users.db import get_users_connection, get_job_title


def list_users() -> None:
    """Print all app_user records in a Rich table, sorted by app_id."""
    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, app_id, username, notes, created_at, updated_at
        FROM app_users
        ORDER BY app_id;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        console.print("\n[yellow]No user records found.[/yellow]\n")
        return

    table = Table(title="Application Users", box=box.SIMPLE_HEAVY, border_style="bright_magenta")
    table.add_column("ID",        justify="right", style="dim",        no_wrap=True)
    table.add_column("App ID",    justify="right", style="cyan",       no_wrap=True)
    table.add_column("Role",      style="bold white")
    table.add_column("Username",  style="bold white")
    table.add_column("Notes",     style="dim")
    table.add_column("Created",   style="dim")
    table.add_column("Updated",   style="dim")

    for row in rows:
        job_title = get_job_title(row["app_id"]) or "[dim]unknown[/dim]"
        table.add_row(
            str(row["id"]),
            str(row["app_id"]),
            job_title,
            row["username"],
            row["notes"] or "—",
            str(row["created_at"])[:16],
            str(row["updated_at"])[:16],
        )

    console.print()
    console.print(table)
    console.print()
