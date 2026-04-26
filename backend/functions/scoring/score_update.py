"""
score_update.py - Quick-update priority score and recompute attainability.
"""

from rich.prompt import Prompt

from functions.core.db import get_connection, get_cursor
from functions.core.config import console
from functions.scoring.attainability import score_application


def quick_score_update():
    """Quick-update the priority score for an application and recompute attainability."""
    app_id = Prompt.ask("\n[bold]Enter application ID to score[/bold]")

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT * FROM applications WHERE id = ?;", (app_id,))
    row = cur.fetchone()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        cur.close()
        conn.close()
        return

    row_dict = dict(row)
    current_p = row_dict.get("priority_score")
    current_a = row_dict.get("attainability_score")

    console.print(f"  [bold]{row_dict['job_title']}[/bold] @ {row_dict['company_name']}")
    console.print(f"  Current priority:      {current_p or 'not set'}")
    console.print(f"  Current attainability: {current_a or 'not set'}")

    raw = Prompt.ask("\n[bold]Priority score[/bold] (1-10, 10 = highest interest)", default=str(current_p or ""))
    if not raw.strip():
        console.print("[dim]No priority score entered. Skipping.[/dim]\n")
        cur.close()
        conn.close()
        return

    try:
        priority = int(raw)
        if not (1 <= priority <= 10):
            console.print("[red]Must be between 1 and 10.[/red]\n")
            cur.close()
            conn.close()
            return
    except ValueError:
        console.print("[red]Must be an integer.[/red]\n")
        cur.close()
        conn.close()
        return

    cur.execute("""
        UPDATE applications
        SET priority_score = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?;
    """, (priority, app_id))
    conn.commit()
    console.print(f"[bold green]Priority set to {priority}/10[/bold green]")

    # Auto-compute attainability
    att_score = score_application(row_dict)
    if att_score is not None:
        cur.execute("""
            UPDATE applications
            SET attainability_score = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        """, (att_score, app_id))
        conn.commit()
        console.print(f"[bold green]Attainability auto-scored: {att_score}/10[/bold green]")
    else:
        resume = row_dict.get("resume_used")
        if not resume:
            console.print("[dim]No resume linked -- attainability cannot be auto-computed.[/dim]")
        else:
            console.print(f"[dim]Resume file '{resume}' not found in resumes/ -- attainability not updated.[/dim]")

    cur.close()
    conn.close()
    console.print()
