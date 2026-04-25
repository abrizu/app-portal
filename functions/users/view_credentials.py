"""
functions/users/view_credentials.py - Look up and display credentials for an app_id.

Validates app_id against app_portal.db before querying users.db.
"""

from rich.table import Table
from rich import box
from rich.prompt import Prompt

from functions.core.config import console
from functions.users.db import get_users_connection, get_job_title


def view_credentials() -> None:
    """Look up all credential records for a given app_id and display them."""
    console.print("\n[bold cyan]── View Credentials ──[/bold cyan]")

    app_id_raw = Prompt.ask("[bold]App ID[/bold]").strip()
    if not app_id_raw.isdigit():
        console.print("[red]Invalid app ID.[/red]")
        return

    app_id = int(app_id_raw)

    # Validate app_id exists in app_portal.db
    job_title = get_job_title(app_id)
    if job_title is None:
        console.print(f"[red]App ID {app_id} not found in app_portal.db.[/red]")
        return

    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT app_id, username, password, notes
        FROM app_users
        WHERE app_id = ?
        ORDER BY app_id;
        """,
        (app_id,),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        console.print(f"\n[yellow]No credentials found for App ID {app_id} — {job_title}.[/yellow]\n")
        return

    table = Table(
        title=f"Credentials — App ID {app_id}  ·  {job_title}",
        box=box.SIMPLE_HEAVY,
        border_style="bright_cyan",
    )
    table.add_column("App ID",    justify="right", style="cyan",       no_wrap=True)
    table.add_column("Username",  style="bold white")
    table.add_column("Password",  style="green")
    table.add_column("Notes",     style="dim")

    for row in rows:
        table.add_row(
            str(row["app_id"]),
            row["username"],
            row["password"],
            row["notes"] or "—",
        )

    console.print()
    console.print(table)
    console.print()
