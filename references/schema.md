# Application Schema Reference

> Use `Ctrl+Shift+V` in VS Code to preview this as a formatted table.

---

## Applications Table

| Field | Type | Required | Description / Accepted Values |
|-------|------|----------|-------------------------------|
| `id` | SERIAL | auto | Auto-increment primary key — don't set this |
| `job_title` | VARCHAR(255) | **YES** | Title of the position (e.g. "Software Engineer") |
| `company_name` | VARCHAR(255) | **YES** | Company name (e.g. "Apple") |
| `posting_date` | DATE | no | When the job was posted — format: `YYYY-MM-DD` |
| `application_date` | DATE | **YES** | Defaults to today. "Days ago" calculated at display time |
| `status` | VARCHAR(50) | **YES** | `Applying` · `Applied` · `Screening` · `Interviewing` · `Technical` · `Offer` · `Rejected` · `Withdrawn` · `Ghosted` |
| `technologies` | TEXT | no | Comma-separated (e.g. `Python, SQL, AWS`) |
| `posting_url` | TEXT | no | Link to the job posting |
| `location` | VARCHAR(255) | no | e.g. `Remote`, `NYC`, `Hybrid - DC` |
| `job_type` | VARCHAR(50) | no | `Full-time` · `Internship` · `Contract` · `Part-time` |
| `salary_range` | VARCHAR(100) | no | e.g. `$60,000` or `80k-100k` |
| `source` | VARCHAR(100) | no | `LinkedIn` · `Indeed` · `Referral` · `Company Site` · `Handshake` |
| `resume_used` | VARCHAR(255) | no | Filename from `resumes/` folder (e.g. `INITIAL_ROLE_MMDDYY.pdf`) |
| `notes` | TEXT | no | Freeform notes |
| `priority_score` | INTEGER | no | Manual interest rating: `1` (lowest) to `10` (highest) |
| `attainability_score` | INTEGER | no | Auto-computed from resume keyword matching: `1` (least) to `10` (most) |
| `created_at` | TIMESTAMP | auto | Set automatically on insert |
| `updated_at` | TIMESTAMP | auto | Set automatically on update |

---


## Available Resumes

Check the `resumes/` folder for your current files.
Reference them by filename in the `resume_used` field.
