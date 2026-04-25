from rich.panel import Panel
from rich.prompt import Prompt

from functions.core.db import initialize_database
from functions.core.config import console

from functions.actions.forms import generate_form, generate_edit_form, submit_form
from functions.actions.list_apps import list_applications
from functions.actions.view_app import view_application
from functions.actions.status_update import update_status
from functions.actions.delete_app import delete_application
from functions.actions.search import search_applications
from functions.actions.summary import summary_menu

# ──────────────────────────── applications menu ────────────────────────────

def applications_menu():
    """Initialize DB and run the applications interactive menu loop."""
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
        "9": ("Summary / Stats",      summary_menu),
        "0": ("Back to Launcher",     None),
    }

    while True:
        console.print("\n[bold]── Applications Menu ──[/bold]")
        for key, (label, _) in menu_items.items():
            console.print(f"  [bold cyan][{key}][/bold cyan] {label}")

        all_choices = []
        for k in menu_items.keys():
            all_choices.append(k)
            if k.isalpha():
                all_choices.append(k.lower())

        choice = Prompt.ask("\nChoose an option", choices=all_choices, default="4")
        choice = choice.upper()  # Normalize letter keys

        if choice == "0":
            console.print("[dim]Returning to Launcher...[/dim]\n")
            break

        _, action = menu_items[choice]
        if action:
            action()