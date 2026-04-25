"""
functions/users/update_user.py - Edit username, password, or notes for an app_user record.
"""

from rich.prompt import Prompt, Confirm

from functions.core.config import console
from functions.users.db import get_users_connection


def update_user() -> None:
    """Fetch a user record and let the operator update individual fields."""
    console.print("\n[bold cyan]── Update Application User ──[/bold cyan]")

    user_id = Prompt.ask("[bold]User ID[/bold] [dim](ID column — not App ID)[/dim]").strip()
    if not user_id.isdigit():
        console.print("[red]Invalid ID.[/red]")
        return

    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, app_id, username, password, notes FROM app_users WHERE id = ?;",
        (int(user_id),),
    )
    row = cur.fetchone()

    if not row:
        console.print(f"[red]No user with ID #{user_id}.[/red]")
        cur.close()
        conn.close()
        return

    console.print(
        f"\n  [bold]#{row['id']}[/bold] — App ID {row['app_id']}  "
        f"Username: [bold]{row['username']}[/bold]  "
        f"Notes: {row['notes'] or '—'}"
    )
    console.print()

    new_username = Prompt.ask(
        "[bold]New username[/bold]", default=row["username"]
    ).strip() or row["username"]

    new_password = Prompt.ask(
        "[bold]New password[/bold]", default=row["password"]
    ).strip() or row["password"]

    new_notes_raw = Prompt.ask(
        "[bold]New notes[/bold] (leave blank to keep current)",
        default=row["notes"] or "",
    ).strip()
    new_notes = new_notes_raw if new_notes_raw else row["notes"]

    cur.execute(
        """
        UPDATE app_users
        SET username = ?, password = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
        """,
        (new_username, new_password, new_notes, int(user_id)),
    )
    conn.commit()
    cur.close()
    conn.close()
    console.print(f"\n[bold green]✓ User #{user_id} updated.[/bold green]\n")
