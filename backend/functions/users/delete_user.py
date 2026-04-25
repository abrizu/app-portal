"""
functions/users/delete_user.py - Remove a user record from users.db.
"""

from rich.prompt import Prompt, Confirm

from functions.core.config import console
from functions.users.db import get_users_connection


def delete_user() -> None:
    """Prompt for a user ID, confirm, and delete the record."""
    console.print("\n[bold cyan]── Delete Application User ──[/bold cyan]")

    user_id = Prompt.ask("[bold]User ID[/bold] [dim](ID column — not App ID)[/dim]").strip()
    if not user_id.isdigit():
        console.print("[red]Invalid ID.[/red]")
        return

    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, app_id, username FROM app_users WHERE id = ?;",
        (int(user_id),),
    )
    row = cur.fetchone()

    if not row:
        console.print(f"[red]No user with ID #{user_id}.[/red]")
        cur.close()
        conn.close()
        return

    console.print(
        f"  [bold]#{row['id']}[/bold] — App ID {row['app_id']}  "
        f"Username: [bold]{row['username']}[/bold]"
    )
    if not Confirm.ask("\n  [red]Delete this record?[/red]", default=False):
        console.print("  Cancelled.\n")
        cur.close()
        conn.close()
        return

    cur.execute("DELETE FROM app_users WHERE id = ?;", (int(user_id),))
    conn.commit()
    cur.close()
    conn.close()
    console.print(f"[bold green]✓ User #{user_id} deleted.[/bold green]\n")
