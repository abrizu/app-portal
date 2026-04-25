"""
functions/users/add_user.py - Add a new app_user record to users.db.

Validates app_id against app_portal.db before inserting.
Credentials are stored as plain text for quick retrieval by app_id.
Optionally generates a strong random 16-character password.
"""

import secrets
import string
from rich.prompt import Prompt, Confirm

from functions.core.config import console
from functions.users.db import get_users_connection, get_job_title


_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*()-_=+[]{}|;:,.<>?"


def _generate_password(length: int = 16) -> str:
    """Return a cryptographically random password of the given length."""
    while True:
        pw = "".join(secrets.choice(_ALPHABET) for _ in range(length))
        has_upper  = any(c in string.ascii_uppercase for c in pw)
        has_lower  = any(c in string.ascii_lowercase for c in pw)
        has_digit  = any(c in string.digits for c in pw)
        has_symbol = any(c not in string.ascii_letters + string.digits for c in pw)
        if has_upper and has_lower and has_digit and has_symbol:
            return pw


def add_user() -> None:
    """Prompt for credentials and insert a new record into app_users."""
    console.print("\n[bold cyan]── Add Application User ──[/bold cyan]")

    app_id_raw = Prompt.ask("[bold]App ID[/bold] (from app_portal)")
    try:
        app_id = int(app_id_raw)
    except ValueError:
        console.print("[red]Invalid app ID — must be an integer.[/red]")
        return

    # Validate app_id exists in app_portal.db
    job_title = get_job_title(app_id)
    if job_title is None:
        console.print(f"[red]App ID {app_id} not found in app_portal.db.[/red]")
        return

    console.print(f"  [dim]Role:[/dim] [bold white]{job_title}[/bold white]")

    username = Prompt.ask("[bold]Username[/bold]").strip()
    if not username:
        console.print("[red]Username cannot be empty.[/red]")
        return

    # Password: auto-generate or manual entry
    use_auto = Confirm.ask("  Use an auto-generated password?", default=True)
    if use_auto:
        password = _generate_password()
    else:
        password = Prompt.ask("[bold]Password[/bold]").strip()
        if not password:
            console.print("[red]Password cannot be empty.[/red]")
            return

    notes = Prompt.ask("[bold]Notes[/bold] (optional)", default="").strip() or None

    conn = get_users_connection()
    cur = conn.cursor()

    # Find the lowest available ID to fill gaps
    cur.execute("SELECT id FROM app_users ORDER BY id;")
    existing_ids = [row["id"] for row in cur.fetchall()]
    new_id = 1
    for eid in existing_ids:
        if eid == new_id:
            new_id += 1
        elif eid > new_id:
            break

    cur.execute(
        """
        INSERT INTO app_users (id, app_id, username, password, notes)
        VALUES (?, ?, ?, ?, ?);
        """,
        (new_id, app_id, username, password, notes),
    )
    conn.commit()
    cur.close()
    conn.close()

    console.print(f"\n[bold green]✓ Credentials saved for App ID {app_id} — {job_title}.[/bold green]")
    console.print(f"  [dim]Username:[/dim] [bold white]{username}[/bold white]")
    console.print(f"  [dim]Password:[/dim] [bold green]{password}[/bold green]\n")
