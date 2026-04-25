"""
functions/users/verify_user.py - Verify a password against the stored bcrypt hash.
"""

import bcrypt
from rich.prompt import Prompt

from functions.core.config import console
from functions.users.db import get_users_connection


def verify_user() -> None:
    """Prompt for a user ID and test a password against the stored hash."""
    console.print("\n[bold cyan]── Verify User Password ──[/bold cyan]")

    user_id = Prompt.ask("[bold]User ID[/bold]").strip()
    if not user_id.isdigit():
        console.print("[red]Invalid ID.[/red]")
        return

    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, app_id, username, password FROM app_users WHERE id = ?;",
        (int(user_id),),
    )
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        console.print(f"[red]No user with ID #{user_id}.[/red]")
        return

    console.print(
        f"  Verifying [bold]{row['username']}[/bold] (App ID {row['app_id']}) …"
    )
    password = Prompt.ask("[bold]Password[/bold]", password=True).strip()

    match = bcrypt.checkpw(password.encode("utf-8"), row["password"].encode("utf-8"))

    if match:
        console.print("[bold green]✓ Password matches.[/bold green]\n")
    else:
        console.print("[bold red]✗ Password does not match.[/bold red]\n")
