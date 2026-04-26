"""
forms.py - YAML form workflow for creating, editing, and submitting applications.

Functions:
    generate_form()      - Generate a blank YAML form for a new application.
    generate_edit_form() - Generate a pre-filled YAML form for editing.
    submit_form()        - Parse and submit a YAML form to the database.
"""

import os
import time
import yaml
from pathlib import Path
from datetime import date, datetime
from rich.prompt import Prompt, Confirm

from functions.core.db import get_connection, get_cursor
from functions.core.config import console, FORMS_DIR
from functions.scoring.attainability import score_application


def _build_form_dict(defaults=None):
    """
    Build an ordered dict representing the YAML form template.
    If `defaults` is provided (a DB row dict), pre-fill with those values.
    """
    if defaults is not None:
        d = dict(defaults)
    else:
        d = {}
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
        "priority_score":   d.get("priority_score") or "",
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
        lines.append(f"# ║  Editing application ID: {str(app_id):>35s} ║")
    # List available resumes for reference
    resumes_dir = Path("resumes")
    resume_files = sorted(resumes_dir.glob("*")) if resumes_dir.exists() else []
    resume_names = [f.name for f in resume_files if f.is_file()]

    lines += [
        "# ╠══════════════════════════════════════════════════════════════╣",
        "# ║  STATUS OPTIONS:                                             ║",
        "# ║  Applying | Applied   | Screening | Interviewing | Technical ║",
        "# ║  Offer    | Rejected  | Withdrawn | Ghosted                  ║",
        "# ║                                                              ║",
        "# ║  DATE FORMAT: YYYY-MM-DD  (or N/A if unknown)                ║",
        "# ║  TECHNOLOGIES: comma-separated (e.g. Python, SQL, AWS)       ║",
        "# ║                                                              ║",
        "# ║  PRIORITY SCORE: 1-10  (10 = highest interest, 1 = lowest)   ║",
        "# ║  ATTAINABILITY: auto-computed from resume (not editable)     ║",
    ]
    lines += [
        "# ╚══════════════════════════════════════════════════════════════╝",
        "",
    ]
    return "\n".join(lines)


def generate_form():
    """Generate a blank YAML form file for a new application."""
    form_data = _build_form_dict()
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
    cur = conn.cursor()
    cur.execute("SELECT * FROM applications WHERE id = ?;", (app_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        console.print(f"[red]Application #{app_id} not found.[/red]")
        return

    form_data = _build_form_dict(defaults=row)
    # Stash the ID so the submit function knows this is an update
    form_data["_id"] = row["id"]

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

    # Parse priority score (integer 1-10 or None)
    raw_priority     = _clean(data.get("priority_score"))
    priority_score   = None
    if raw_priority:
        try:
            priority_score = int(raw_priority)
            if not (1 <= priority_score <= 10):
                console.print("[red]Error: priority_score must be between 1 and 10.[/red]")
                return
        except ValueError:
            console.print("[red]Error: priority_score must be an integer (1-10).[/red]")
            return

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
                priority_score = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?;
        """, (
            job_title, company_name, posting_date, application_date, status,
            technologies, posting_url, location, job_type,
            salary_range, source, resume_used, priority_score, notes, app_id,
        ))
        conn.commit()

        # Auto-compute attainability if a resume is linked
        app_data = {
            "technologies": technologies, "location": location,
            "job_type": job_type, "status": status, "resume_used": resume_used,
        }
        att_score = score_application(app_data)
        if att_score is not None:
            cur.execute("UPDATE applications SET attainability_score = ? WHERE id = ?;",
                        (att_score, app_id))
            conn.commit()

        cur.close()
        conn.close()
        console.print(f"\n[bold green]✓ Application #{app_id} updated successfully![/bold green]")
        if att_score is not None:
            console.print(f"  [dim]Attainability auto-scored: {att_score}/10[/dim]")
    else:
        # INSERT new record
        cur.execute("""
            INSERT INTO applications
                (job_title, company_name, posting_date, application_date, status,
                 technologies, posting_url, location, job_type, salary_range, source, resume_used,
                 priority_score, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_title, company_name, posting_date, application_date, status,
            technologies, posting_url, location, job_type,
            salary_range, source, resume_used, priority_score, notes,
        ))
        new_id = cur.lastrowid
        conn.commit()

        # Auto-compute attainability if a resume is linked
        app_data = {
            "technologies": technologies, "location": location,
            "job_type": job_type, "status": status, "resume_used": resume_used,
        }
        att_score = score_application(app_data)
        if att_score is not None:
            cur.execute("UPDATE applications SET attainability_score = ? WHERE id = ?;",
                        (att_score, new_id))
            conn.commit()

        cur.close()
        conn.close()
        console.print(f"\n[bold green]✓ Application #{new_id} added successfully![/bold green]")
        if att_score is not None:
            console.print(f"  [dim]Attainability auto-scored: {att_score}/10[/dim]")

    # Offer to clean up the submitted form
    if Confirm.ask("  Delete the submitted form file?", default=True):
        os.remove(selected)
        console.print(f"  [dim]Removed {selected.name}[/dim]\n")
    else:
        console.print()
