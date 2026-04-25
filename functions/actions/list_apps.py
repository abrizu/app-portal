"""
list_apps.py - Display all applications in a rich table.
"""

from rich.table import Table
from rich import box

from functions.core.db import get_connection, get_cursor
from functions.core.config import console, _days_since


def list_applications():
    """Display all applications in a rich table."""
    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("""
        SELECT id, job_title, company_name, posting_date, application_date,
               status, technologies, location, job_type, source,
               priority_score, attainability_score
        FROM applications
        ORDER BY application_date DESC;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        console.print("\n[yellow]No applications found. Add one first![/yellow]\n")
        return

    table = Table(
        title="My Job Applications",
        box=box.ROUNDED,
        show_lines=True,
        title_style="bold magenta",
    )
    table.add_column("ID", style="dim", width=4)
    table.add_column("Job Title", style="bold white", max_width=30)
    table.add_column("Company", style="cyan", max_width=20)
    table.add_column("Applied", style="green")
    table.add_column("Days Ago", style="yellow")
    table.add_column("Status", max_width=14)
    table.add_column("Technologies", style="dim", max_width=25)
    table.add_column("Location", max_width=15)
    table.add_column("Type", max_width=12)
    table.add_column("Source", style="dim", max_width=12)
    table.add_column("P/A", style="bold yellow", width=5, justify="center")

    status_colors = {
        "Applied": "white",
        "Screening": "blue",
        "Interviewing": "cyan",
        "Technical": "magenta",
        "Offer": "bold green",
        "Rejected": "red",
        "Withdrawn": "dim",
        "Ghosted": "dim red",
    }

    for r in rows:
        status_style = status_colors.get(r["status"], "white")
        p = str(r["priority_score"]) if r["priority_score"] else "-"
        a = str(r["attainability_score"]) if r["attainability_score"] else "-"
        pa_display = f"{p}/{a}"
        table.add_row(
            str(r["id"]),
            r["job_title"],
            r["company_name"],
            str(r["application_date"]) if r["application_date"] else "-",
            _days_since(r["application_date"]),
            f"[{status_style}]{r['status']}[/{status_style}]",
            r["technologies"] or "-",
            r["location"] or "-",
            r["job_type"] or "-",
            r["source"] or "-",
            pa_display,
        )

    console.print()
    console.print(table)
    console.print()
