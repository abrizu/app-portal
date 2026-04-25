"""
functions/users/auth.py - Master login gate for users.py.

On first run: prompts to create a master username + bcrypt-hashed password.
On subsequent runs: verifies the entered credentials before granting access.
"""

import bcrypt
from rich.prompt import Prompt

from functions.core.config import console
from functions.users.db import get_users_connection


def _get_master() -> dict | None:
    """Return the single master_auth row, or None if not set up yet."""
    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute("SELECT username, password FROM master_auth LIMIT 1;")
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def setup_master_login() -> None:
    """First-run setup: create master username and bcrypt-hashed password."""
    console.print(
        "\n[bold yellow]No master login found. Set one up now.[/bold yellow]"
    )

    username = Prompt.ask("[bold]Create master username[/bold]").strip()
    if not username:
        console.print("[red]Username cannot be empty. Exiting.[/red]")
        raise SystemExit(1)

    while True:
        pw = Prompt.ask("[bold]Create master password[/bold]", password=True).strip()
        if not pw:
            console.print("[red]Password cannot be empty.[/red]")
            continue
        confirm = Prompt.ask("[bold]Confirm password[/bold]", password=True).strip()
        if pw != confirm:
            console.print("[red]Passwords do not match — try again.[/red]")
            continue
        break

    hashed = bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conn = get_users_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO master_auth (username, password) VALUES (?, ?);",
        (username, hashed),
    )
    conn.commit()
    cur.close()
    conn.close()

    console.print("[bold green]✓ Master login created.[/bold green]\n")


def login() -> bool:
    """
    Prompt for master credentials. Returns True on success, False on failure.
    Allows up to 3 attempts before returning False.
    """
    master = _get_master()
    if not master:
        setup_master_login()
        master = _get_master()

    console.print("\n[bold]── Application User Manager Login ──[/bold]")

    for attempt in range(1, 4):
        username = Prompt.ask("[bold]Username[/bold]").strip()
        password = Prompt.ask("[bold]Password[/bold]", password=True).strip()

        username_ok = username == master["username"]
        password_ok = bcrypt.checkpw(
            password.encode("utf-8"), master["password"].encode("utf-8")
        )

        if username_ok and password_ok:
            console.print("[bold green]✓ Access granted.[/bold green]")
            return True

        remaining = 3 - attempt
        if remaining > 0:
            console.print(
                f"[red]Invalid credentials.[/red] "
                f"[dim]{remaining} attempt(s) remaining.[/dim]"
            )
        else:
            console.print("[red]Access denied.[/red]")

    return False
