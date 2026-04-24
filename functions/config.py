from pathlib import Path
from datetime import date, datetime
from rich.console import Console

console = Console()

FORMS_DIR = Path("forms")
FORMS_DIR.mkdir(exist_ok=True)

STATUS_OPTIONS = ["Applied", "Screening", "Interviewing", "Technical", "Offer", "Rejected", "Withdrawn", "Ghosted"]

def _days_since(app_date):
    if app_date is None:
        return "-"
    if isinstance(app_date, datetime):
        app_date = app_date.date()
    delta = (date.today() - app_date).days
    if delta == 0:
        return "today"
    elif delta == 1:
        return "1 day ago"
    else:
        return f"{delta} days ago"
