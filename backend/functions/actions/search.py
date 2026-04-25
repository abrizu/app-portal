"""
search.py - Search applications by keyword.
"""

from rich.table import Table
from rich.prompt import Prompt
from rich import box

from functions.core.db import get_connection, get_cursor
from functions.core.config import console


def search_applications():
    """Search applications by keyword across job title, company, and technologies."""
    keyword = Prompt.ask("\n[bold]Search keyword[/bold]")
    pattern = f"%{keyword}%"

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("""
        SELECT id, job_title, company_name, application_date, status, technologies
        FROM applications
        WHERE job_title LIKE ? OR company_name LIKE ? OR technologies LIKE ?
        ORDER BY application_date DESC;
    """, (pattern, pattern, pattern))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        console.print(f"[yellow]No results for '{keyword}'.[/yellow]\n")
        return

    table = Table(title=f"Search: '{keyword}'", box=box.SIMPLE)
    table.add_column("ID", width=4)
    table.add_column("Job Title", max_width=30)
    table.add_column("Company", max_width=20)
    table.add_column("Applied")
    table.add_column("Status")
    table.add_column("Technologies", max_width=25)

    for r in rows:
        table.add_row(
            str(r["id"]), r["job_title"], r["company_name"],
            str(r["application_date"]), r["status"], r["technologies"] or "-"
        )

    console.print(table)
    console.print()
