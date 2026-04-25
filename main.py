"""
main.py - Interactive CLI for the Job Application Tracker.
Run:  python main.py
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent / "backend"))

from rich.prompt import Prompt
from functions.core.config import console

from functions.core.users import users_menu
from functions.core.applications import applications_menu

# ──────────────────────────── main launcher ────────────────────────────

def main():
    while True:
        console.print("\n[bold]── Main Launcher ──[/bold]")
        console.print("  [bold cyan][1][/bold cyan] Applications Menu")
        console.print("  [bold cyan][2][/bold cyan] Users Menu")
        console.print("  [bold cyan][0][/bold cyan] Exit")
        
        choice = Prompt.ask("\nChoose an option", choices=["1", "2", "0"], default="1")
        if choice == "1":
            applications_menu()
        elif choice == "2":
            users_menu()
        elif choice == "0":
            console.print("[dim]Goodbye![/dim]\n")
            break

if __name__ == "__main__":
    main()
