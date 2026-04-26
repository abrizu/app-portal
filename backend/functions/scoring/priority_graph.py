"""
priority_graph.py - Scatter plot visualization for Priority vs Attainability.

Renders a terminal scatter plot using plotext, with each application
plotted by its priority score (Y) and attainability score (X).
Applications are color-coded by status and labeled with company names.
"""

import plotext as plt

from functions.core.db import get_connection, get_cursor
from functions.core.config import console


# Status -> plotext color mapping
_STATUS_COLORS = {
    "Applied":       "white",
    "Screening":     "blue",
    "Interviewing":  "cyan",
    "Technical":     "magenta",
    "Offer":         "green",
    "Rejected":      "red",
    "Withdrawn":     "gray",
    "Ghosted":       "orange",
}


def show_priority_graph():
    """
    Fetch all applications that have both priority and attainability scores,
    then render a scatter plot in the terminal.

    X-axis: Attainability (1 = least, 10 = most)
    Y-axis: Priority      (1 = lowest interest, 10 = highest interest)
    Sweet spot: top-right quadrant.
    """
    conn = get_connection()
    cur = get_cursor(conn)
    cur.execute("""
        SELECT id, job_title, company_name, status,
               priority_score, attainability_score
        FROM applications
        WHERE priority_score IS NOT NULL
          AND attainability_score IS NOT NULL
        ORDER BY company_name;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if len(rows) < 2:
        scored = len(rows)
        console.print(
            f"\n[yellow]Only {scored} application(s) have both scores set. "
            f"Add priority scores (via form or Quick Score Update) and link a resume "
            f"to at least 2 applications to generate the graph.[/yellow]\n"
        )
        return

    # Group points by status for color coding
    status_groups: dict[str, dict] = {}
    labels: list[tuple[float, float, str]] = []

    for r in rows:
        row = dict(r)
        status = row["status"] or "Applied"
        x = row["attainability_score"]
        y = row["priority_score"]

        if status not in status_groups:
            status_groups[status] = {"x": [], "y": []}
        status_groups[status]["x"].append(x)
        status_groups[status]["y"].append(y)

        # Short label: first word of company, or truncated
        company = row["company_name"] or "?"
        short = company.split()[0][:12] if company else "?"
        labels.append((x, y, short))

    # ── Build the plot ──
    plt.clear_figure()
    plt.theme("clear")
    plt.title("Priority vs Attainability")
    plt.xlabel("Attainability -->")
    plt.ylabel("Priority -->")

    # Set axis limits with a small margin
    plt.xlim(0.5, 10.5)
    plt.ylim(0.5, 10.5)

    # Plot each status group with its color
    for status, coords in status_groups.items():
        color = _STATUS_COLORS.get(status, "white")
        plt.scatter(
            coords["x"],
            coords["y"],
            label=status,
            color=color,
            marker="dot",
        )

    # Draw quadrant reference lines at midpoint (5.5)
    plt.hline(5.5, color="gray")
    plt.vline(5.5, color="gray")

    plt.plot_size(80, 25)
    plt.show()

    # Print quadrant legend below the graph
    console.print()
    console.print("[bold]Quadrant Reference:[/bold]")
    console.print("  [dim]Top-Right:[/dim]   SWEET SPOT    (high priority, attainable)")
    console.print("  [dim]Top-Left:[/dim]    REACH         (high priority, hard to get)")
    console.print("  [dim]Bottom-Right:[/dim] SAFETY NET   (low priority, attainable)")
    console.print("  [dim]Bottom-Left:[/dim]  DEPRIORITIZE (low priority, hard to get)")
    console.print()

    # Print a reference table of plotted applications
    console.print("[bold]Plotted Applications:[/bold]")
    for x, y, label in sorted(labels, key=lambda t: (-t[1], -t[0])):
        console.print(f"  {label:<14s}  Priority: {y:<2d}  Attainability: {x:<2d}")
    console.print()
