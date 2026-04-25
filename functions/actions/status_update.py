"""
status_update.py - Quick-update the status of an existing application.
"""

from rich.prompt import Prompt

from functions.core.db import get_connection, get_cursor
from functions.core.config import console


def update_status():
    """Quick-update the status of an existing application (no form needed)."""
    app_id = Prompt.ask("\n[bold]Enter application ID to update[/bold]")

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT id, job_title, company_name, status \
                FROM applications \
                WHERE id = ?;", (app_id,))
    row = cur.fetchone()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        cur.close()
        conn.close()
        return

    # Shortcut map: single letter -> full status name
    status_shortcuts = {
        "A": "Applied",
        "S": "Screening",
        "I": "Interviewing",
        "T": "Technical",
        "O": "Offer",
        "R": "Rejected",
        "W": "Withdrawn",
        "G": "Ghosted",
    }

    console.print(f"  Current: [bold]{row['job_title']}[/bold] @ {row['company_name']} — [{row['status']}]")
    console.print("  [bold]Options:[/bold]  [cyan](A)[/cyan]pplied  [cyan](S)[/cyan]creening  [cyan](I)[/cyan]nterviewing  [cyan](T)[/cyan]echnical")
    console.print("            [cyan](O)[/cyan]ffer    [cyan](R)[/cyan]ejected   [cyan](W)[/cyan]ithdrawn     [cyan](G)[/cyan]hosted")
    raw = Prompt.ask("[bold]New status[/bold]", default=row["status"])

    # Resolve shortcut letter to full name
    new_status = status_shortcuts.get(raw.upper(), raw)

    cur.execute("""
        UPDATE applications
        SET status = ?, 
        updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?;
    """, (new_status, app_id))
    conn.commit()
    cur.close()
    conn.close()
    console.print(f"[bold green]Status updated to '{new_status}'[/bold green]\n")
