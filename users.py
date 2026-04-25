"""
users.py - Standalone CLI for managing Application User credentials.
Run:  python users.py

Backed by users.db (separate from app_portal.db).
Access is gated by a master bcrypt-hashed login.
Application credentials (username/password) are stored in plain text
and intended for quick retrieval by app_id.
"""

from rich.panel import Panel
from rich.prompt import Prompt

from functions.core.config import console
from functions.users.db import initialize_users_database
from functions.users.auth import login
from functions.users.add_user import add_user
from functions.users.list_users import list_users
from functions.users.view_credentials import view_credentials
from functions.users.update_user import update_user
from functions.users.delete_user import delete_user


def main() -> None:
    """Initialize the users DB, authenticate, then run the interactive menu loop."""
    initialize_users_database()

    console.print(Panel(
        "[bold white]Application User Manager[/bold white]\n"
        "[dim]users.db · master login required[/dim]",
        border_style="bright_cyan",
        padding=(1, 4),
    ))

    # ── Authentication gate ──────────────────────────────────────────
    if not login():
        raise SystemExit(1)

    # ── Menu ─────────────────────────────────────────────────────────
    menu_items = {
        "1": ("Add User",             add_user),
        "2": ("List Users",           list_users),
        "3": ("View Credentials",     view_credentials),
        "4": ("Update User",          update_user),
        "5": ("Delete User",          delete_user),
        "0": ("Exit",                 None),
    }

    while True:
        console.print("\n[bold]── Users Menu ──[/bold]")
        for key, (label, _) in menu_items.items():
            console.print(f"  [bold cyan][{key}][/bold cyan] {label}")

        choice = Prompt.ask(
            "\nChoose an option",
            choices=list(menu_items.keys()),
            default="2",
        )

        if choice == "0":
            console.print("[dim]Goodbye![/dim]\n")
            break

        _, action = menu_items[choice]
        if action:
            action()


if __name__ == "__main__":
    main()
