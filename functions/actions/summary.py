"""
summary.py - Print a quick summary / stats dashboard.
"""

from rich.table import Table
from rich.panel import Panel
from rich import box

from functions.core.db import get_connection, get_cursor
from functions.core.config import console
from functions.scoring.score_update import quick_score_update
from functions.scoring.priority_graph import show_priority_graph
from rich.prompt import Prompt


def show_summary():
    """Print a quick summary / stats dashboard."""
    conn = get_connection()
    cur = get_cursor(conn)

    cur.execute("SELECT COUNT(*) AS total FROM applications;")
    total = cur.fetchone()["total"]

    cur.execute("SELECT status, COUNT(*) AS cnt FROM applications GROUP BY status ORDER BY cnt DESC;")
    statuses = cur.fetchall()

    cur.execute("""
        SELECT company_name, COUNT(*) AS cnt
        FROM applications GROUP BY company_name ORDER BY cnt DESC LIMIT 5;
    """)
    top_companies = cur.fetchall()

    cur.close()
    conn.close()

    console.print(Panel(f"[bold]Total Applications:[/bold] {total}", title="Summary", border_style="magenta"))

    if statuses:
        st = Table(title="By Status", box=box.SIMPLE)
        st.add_column("Status")
        st.add_column("Count", justify="right")
        for s in statuses:
            st.add_row(s["status"], str(s["cnt"]))
        console.print(st)

    if top_companies:
        ct = Table(title="Top Companies", box=box.SIMPLE)
        ct.add_column("Company")
        ct.add_column("Apps", justify="right")
        for c in top_companies:
            ct.add_row(c["company_name"], str(c["cnt"]))
        console.print(ct)
    console.print()


def summary_menu():
    """Sub-menu for Summary, Scoring, and Priority Graph."""
    while True:
        console.print("\n[bold]── Summary / Stats Menu ──[/bold]")
        console.print("  [bold cyan][1][/bold cyan] Quick Score Update")
        console.print("  [bold cyan][2][/bold cyan] Priority Graph")
        console.print("  [bold cyan][3][/bold cyan] View General Summary")
        console.print("  [bold cyan][0][/bold cyan] Back to Main Menu")

        choice = Prompt.ask("\nChoose an option", choices=["1", "2", "3", "0"], default="3")

        if choice == "1":
            quick_score_update()
        elif choice == "2":
            show_priority_graph()
        elif choice == "3":
            show_summary()
        elif choice == "0":
            break
