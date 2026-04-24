import os
import yaml
from pathlib import Path
from datetime import date, datetime
from rich.table import Table
from rich.panel import Panel
from rich.prompt import Prompt, Confirm
from rich import box

from .db import get_connection, get_cursor, initialize_database
from .config import console, FORMS_DIR, STATUS_OPTIONS, _days_since

# ──────────────────────────── YAML form workflow ────────────────────────────

def _build_form_dict(defaults=None):
    """
    Build an ordered dict representing the YAML form template.
    If `defaults` is provided (a DB row dict), pre-fill with those values.
    """
    d = defaults or {}
    today = str(date.today())

    # Convert date objects to strings for YAML serialization
    posting_date_val = d.get("posting_date", "")
    if isinstance(posting_date_val, (date, datetime)):
        posting_date_val = str(posting_date_val)

    app_date_val = d.get("application_date", today)
    if isinstance(app_date_val, (date, datetime)):
        app_date_val = str(app_date_val)

    return {
        "job_title":        d.get("job_title", ""),
        "company_name":     d.get("company_name", ""),
        "posting_date":     posting_date_val or "",
        "application_date":  app_date_val,
        "status":           d.get("status", "Applied"),
        "technologies":     d.get("technologies", ""),
        "posting_url":      d.get("posting_url", ""),
        "location":         d.get("location", ""),
        "job_type":         d.get("job_type", "Full-time"),
        "salary_range":     d.get("salary_range", ""),
        "source":           d.get("source", ""),
        "resume_used":      d.get("resume_used", ""),
        "notes":            d.get("notes", ""),
    }


def _form_header_comment(mode="new", app_id=None):
    """Return the comment block placed at the top of every generated YAML form."""
    lines = [
        "# ╔══════════════════════════════════════════════════════════════╗",
        "# ║          JOB APPLICATION FORM                                ║",
        "# ╠══════════════════════════════════════════════════════════════╣",
        "# ║  Fill in the fields below, save the file, then submit it     ║",
        "# ║  from the main menu (option 'Submit Form').                  ║",
        "# ║                                                              ║",
       f"# ║  Generated: {str(date.today()):>46s}   ║",
    ]
    if mode == "edit" and app_id is not None:
        lines.append(f"# ║  Editing application ID: {str(app_id):>35s}  ║")
    # List available resumes for reference
    resumes_dir = Path("resumes")
    resume_files = sorted(resumes_dir.glob("*")) if resumes_dir.exists() else []
    resume_names = [f.name for f in resume_files if f.is_file()]

    lines += [
        "# ╠══════════════════════════════════════════════════════════════╣",
        "# ║  STATUS OPTIONS:                                             ║",
        "# ║  Applied | Screening | Interviewing | Technical              ║",
        "# ║  Offer   | Rejected  | Withdrawn    | Ghosted                ║",
        "# ║                                                              ║",
        "# ║  DATE FORMAT: YYYY-MM-DD  (or N/A if unknown)                ║",
        "# ║  TECHNOLOGIES: comma-separated (e.g. Python, SQL, AWS)       ║",
    ]
    lines += [
        "# ╚══════════════════════════════════════════════════════════════╝",
        "",
    ]
    return "\n".join(lines)


def generate_form():
    """Generate a blank YAML form file for a new application."""
    form_data = _build_form_dict()
    filename = FORMS_DIR / f"new_application_{date.today().strftime('%Y%m%d_%H%M%S')}.yaml"

    # Use a timestamp suffix to avoid collisions
    import time
    filename = FORMS_DIR / f"new_application_{int(time.time())}.yaml"

    header = _form_header_comment(mode="new")
    yaml_body = yaml.dump(form_data, default_flow_style=False, sort_keys=False, allow_unicode=True)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(header)
        f.write(yaml_body)

    abs_uri = filename.resolve().as_uri()
    console.print(f"\n[bold green]✓ Form generated:[/bold green] [link={abs_uri}]{filename}[/link]")
    console.print(f"  Open it in your editor, fill it out, then come back and choose [bold]'Submit Form'[/bold].\n")


def generate_edit_form():
    """Generate a YAML form pre-filled with an existing application's data for editing."""
    app_id = Prompt.ask("\n[bold]Enter application ID to edit[/bold]")

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT * \
                FROM applications \
                WHERE id = ?;", (app_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        return

    form_data = _build_form_dict(defaults=row)
    # Stash the ID so the submit function knows this is an update
    form_data["_id"] = row["id"]

    import time
    filename = FORMS_DIR / f"edit_application_{app_id}_{int(time.time())}.yaml"

    header = _form_header_comment(mode="edit", app_id=app_id)
    yaml_body = yaml.dump(form_data, default_flow_style=False, sort_keys=False, allow_unicode=True)

    with open(filename, "w", encoding="utf-8") as f:
        f.write(header)
        f.write(yaml_body)

    abs_uri = filename.resolve().as_uri()
    console.print(f"\n[bold green]✓ Edit form generated:[/bold green] [link={abs_uri}]{filename}[/link]")
    console.print(f"  Modify any fields, save, then choose [bold]'Submit Form'[/bold].\n")


def submit_form():
    """
    Parse a YAML form and INSERT or UPDATE into the database.
    If the form has an '_id' field, it's treated as an update; otherwise it's an insert.
    """
    # List available forms
    forms = sorted(FORMS_DIR.glob("*.yaml"), key=os.path.getmtime, reverse=True)
    if not forms:
        console.print("[yellow]No forms found in the 'forms/' directory. Generate one first.[/yellow]\n")
        return

    console.print("\n[bold cyan]── Available Forms ──[/bold cyan]")
    for i, f in enumerate(forms, 1):
        mod_time = datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d %H:%M")
        console.print(f"  [bold cyan][{i}][/bold cyan] {f.name}  [dim]({mod_time})[/dim]")

    choice = Prompt.ask("\n[bold]Select form number[/bold]", default="1")
    try:
        selected = forms[int(choice) - 1]
    except (IndexError, ValueError):
        console.print("[red]Invalid selection.[/red]")
        return

    # Parse the YAML
    with open(selected, "r", encoding="utf-8") as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            console.print(f"[red]YAML parse error:[/red] {e}")
            return

    if not data or not isinstance(data, dict):
        console.print("[red]Form is empty or invalid.[/red]")
        return

    # Validate required fields
    if not data.get("job_title"):
        console.print("[red]Error: 'job_title' is required.[/red]")
        return
    if not data.get("company_name"):
        console.print("[red]Error: 'company_name' is required.[/red]")
        return

    # Normalize empty strings and "N/A" to None for optional fields
    def _clean(val):
        if val is None:
            return None
        s = str(val).strip()
        if s == "" or s.upper() in ("N/A", "NA", "NONE"):
            return None
        return s

    job_title        = _clean(data.get("job_title"))
    company_name     = _clean(data.get("company_name"))
    posting_date     = _clean(data.get("posting_date"))
    application_date = _clean(data.get("application_date")) or str(date.today())
    status           = _clean(data.get("status")) or "Applied"
    technologies     = _clean(data.get("technologies"))
    posting_url      = _clean(data.get("posting_url"))
    location         = _clean(data.get("location"))
    job_type         = _clean(data.get("job_type"))
    salary_range     = _clean(data.get("salary_range"))
    source           = _clean(data.get("source"))
    resume_used      = _clean(data.get("resume_used"))
    notes            = _clean(data.get("notes"))

    app_id = data.get("_id")

    conn = get_connection()
    cur = conn.cursor()

    if app_id:
        # UPDATE existing record
        cur.execute("""
            UPDATE applications
            SET job_title = ?, company_name = ?, posting_date = ?,
                application_date = ?, status = ?, technologies = ?,
                posting_url = ?, location = ?, job_type = ?,
                salary_range = ?, source = ?, resume_used = ?,
                notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        """, (
            job_title, company_name, posting_date, application_date, status,
            technologies, posting_url, location, job_type,
            salary_range, source, resume_used, notes, app_id,
        ))
        conn.commit()
        cur.close()
        conn.close()
        console.print(f"\n[bold green]✓ Application #{app_id} updated successfully![/bold green]")
    else:
        # INSERT new record
        cur.execute("""
            INSERT INTO applications
                (job_title, company_name, posting_date, application_date, status,
                 technologies, posting_url, location, job_type, salary_range, source, resume_used, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_title, company_name, posting_date, application_date, status,
            technologies, posting_url, location, job_type,
            salary_range, source, resume_used, notes,
        ))
        new_id = cur.lastrowid
        conn.commit()
        cur.close()
        conn.close()
        console.print(f"\n[bold green]✓ Application #{new_id} added successfully![/bold green]")

    # Offer to clean up the submitted form
    if Confirm.ask("  Delete the submitted form file?", default=True):
        os.remove(selected)
        console.print(f"  [dim]Removed {selected.name}[/dim]\n")
    else:
        console.print()


def list_applications():
    """Display all applications in a rich table."""
    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("""
        SELECT id, job_title, company_name, posting_date, application_date,
               status, technologies, location, job_type, source
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
        )

    console.print()
    console.print(table)
    console.print()


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
        f"[bold]Notes:[/bold]            {row['notes'] or 'N/A'}\n"
        f"[dim]Created:  {row['created_at']}[/dim]\n"
        f"[dim]Updated:  {row['updated_at']}[/dim]"
    )
    console.print(Panel(detail, title=f"Application #{row['id']}", border_style="cyan"))


def update_status():
    """Quick-update the status of an existing application (no form needed)."""
    app_id = Prompt.ask("\n[bold]Enter application ID to update[/bold]")

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT id, job_title, company_name, status \
                FROM applications \
                WHERE id = ?;", (app_id,))
    row = cur.fetchone()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        cur.close()
        conn.close()
        return

    # Shortcut map: single letter -> full status name
    status_shortcuts = {
        "A": "Applied",
        "S": "Screening",
        "I": "Interviewing",
        "T": "Technical",
        "O": "Offer",
        "R": "Rejected",
        "W": "Withdrawn",
        "G": "Ghosted",
    }

    console.print(f"  Current: [bold]{row['job_title']}[/bold] @ {row['company_name']} — [{row['status']}]")
    console.print("  [bold]Options:[/bold]  [cyan](A)[/cyan]pplied  [cyan](S)[/cyan]creening  [cyan](I)[/cyan]nterviewing  [cyan](T)[/cyan]echnical")
    console.print("            [cyan](O)[/cyan]ffer    [cyan](R)[/cyan]ejected   [cyan](W)[/cyan]ithdrawn     [cyan](G)[/cyan]hosted")
    raw = Prompt.ask("[bold]New status[/bold]", default=row["status"])

    # Resolve shortcut letter to full name
    new_status = status_shortcuts.get(raw.upper(), raw)

    cur.execute("""
        UPDATE applications
        SET status = ?, 
        updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?;
    """, (new_status, app_id))
    conn.commit()
    cur.close()
    conn.close()
    console.print(f"[bold green]Status updated to '{new_status}'[/bold green]\n")


def delete_application():
    """Delete an application by ID."""
    app_id = Prompt.ask("\n[bold]Enter application ID to delete[/bold]")

    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("SELECT id, job_title, company_name FROM applications WHERE id = ?;", (app_id,))
    row = cur.fetchone()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        cur.close()
        conn.close()
        return

    if Confirm.ask(f"  Delete [bold]{row['job_title']}[/bold] @ {row['company_name']}?"):
        cur.execute("DELETE FROM applications WHERE id = ?;", (app_id,))
        conn.commit()
        console.print("[bold green]✓ Deleted.[/bold green]\n")
    else:
        console.print("[dim]Cancelled.[/dim]\n")

    cur.close()
    conn.close()


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