"""
delete_app.py - Delete an application by ID.
"""

from rich.prompt import Prompt, Confirm

from functions.core.db import get_connection, get_cursor
from functions.core.config import console


def delete_application():
    """Delete an application by ID."""
    app_id = Prompt.ask("\n[bold]Enter application ID to delete[/bold]")

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT id, job_title, company_name FROM applications WHERE id = ?;", (app_id,))
    row = cur.fetchone()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        cur.close()
        conn.close()
        return

    if Confirm.ask(f"  Delete [bold]{row['job_title']}[/bold] @ {row['company_name']}?"):
        cur.execute("DELETE FROM applications WHERE id = ?;", (app_id,))
        conn.commit()
        console.print("[bold green]✓ Deleted.[/bold green]\n")
    else:
        console.print("[dim]Cancelled.[/dim]\n")

    cur.close()
    conn.close()
