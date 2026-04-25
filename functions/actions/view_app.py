"""
view_app.py - Show full detail for a single application.
"""

from rich.panel import Panel
from rich.prompt import Prompt

from functions.core.db import get_connection, get_cursor
from functions.core.config import console, _days_since


def view_application():
    """Show full detail for a single application."""
    app_id = Prompt.ask("\n[bold]Enter application ID[/bold]")
    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT * FROM applications WHERE id = ?;", (app_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        return

    p_display = str(row['priority_score']) + "/10" if row['priority_score'] else "N/A"
    a_display = str(row['attainability_score']) + "/10" if row['attainability_score'] else "N/A"

    detail = (
        f"[bold]Job Title:[/bold]        {row['job_title']}\n"
        f"[bold]Company:[/bold]          {row['company_name']}\n"
        f"[bold]Posting Date:[/bold]     {row['posting_date'] or 'N/A'}\n"
        f"[bold]Application Date:[/bold] {row['application_date']}  ({_days_since(row['application_date'])})\n"
        f"[bold]Status:[/bold]           {row['status']}\n"
        f"[bold]Technologies:[/bold]     {row['technologies'] or 'N/A'}\n"
        f"[bold]Posting URL:[/bold]      {row['posting_url'] or 'N/A'}\n"
        f"[bold]Location:[/bold]         {row['location'] or 'N/A'}\n"
        f"[bold]Job Type:[/bold]         {row['job_type'] or 'N/A'}\n"
        f"[bold]Salary Range:[/bold]     {row['salary_range'] or 'N/A'}\n"
        f"[bold]Source:[/bold]           {row['source'] or 'N/A'}\n"
        f"[bold]Resume Used:[/bold]      {row['resume_used'] or 'N/A'}\n"
        f"[bold]Priority:[/bold]         {p_display}  (10 = highest interest)\n"
        f"[bold]Attainability:[/bold]    {a_display}  (auto-computed)\n"
        f"[bold]Notes:[/bold]            {row['notes'] or 'N/A'}\n"
        f"[dim]Created:  {row['created_at']}[/dim]\n"
        f"[dim]Updated:  {row['updated_at']}[/dim]"
    )
    console.print(Panel(detail, title=f"Application #{row['id']}", border_style="cyan"))
