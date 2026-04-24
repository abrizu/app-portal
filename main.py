"""
main.py - Interactive CLI for the Job Application Tracker.
Run:  python main.py
"""

import os
import yaml
from datetime import date, datetime
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import box

from functions.manage_apps import *
from functions.db import get_connection, get_cursor, initialize_database
from functions.config import console, FORMS_DIR, STATUS_OPTIONS, _days_since

# ──────────────────────────── main menu ────────────────────────────

def main():
    """Entry point — initialize DB and run the interactive menu loop."""
    initialize_database()

    console.print(Panel(
        "[bold white]Job Application Portal[/bold white]\n"
        "[dim]SQLite + Python CLI[/dim]",
        border_style="bright_magenta",
        padding=(1, 4),
    ))

    menu_items = {
        "1": ("Generate New Form",    generate_form),
        "2": ("Edit Existing (Form)", generate_edit_form),
        "3": ("Submit Form",          submit_form),
        "4": ("List Applications",    list_applications),
        "5": ("View Application",     view_application),
        "6": ("Quick Status Update",  update_status),
        "7": ("Delete Application",   delete_application),
        "8": ("Search",               search_applications),
        "9": ("Summary / Stats",      show_summary),
        "0": ("Exit",                 None),
    }

    while True:
        console.print("\n[bold]── Main Menu ──[/bold]")
        for key, (label, _) in menu_items.items():
            console.print(f"  [bold cyan][{key}][/bold cyan] {label}")

        choice = Prompt.ask("\nChoose an option", choices=list(menu_items.keys()), default="4")

        if choice == "0":
            console.print("[dim]Goodbye![/dim]\n")
            break

        _, action = menu_items[choice]
        if action:
            action()


if __name__ == "__main__":
    main()
