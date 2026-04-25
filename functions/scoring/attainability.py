"""
attainability.py - Local keyword-matching engine for computing attainability scores.

Parses a resume PDF, extracts skill/technology keywords, and compares them
against a job application's stored data to produce a 1-10 attainability score
(10 = most attainable, 1 = least attainable).
"""

import re
from pathlib import Path
from pypdf import PdfReader

from functions.core.config import console

# ──────────────────────── resume parsing ────────────────────────

# Cache: {resolved_path_str: set_of_keywords}
_resume_cache: dict[str, set[str]] = {}


def _normalize(text: str) -> str:
    """Lowercase and strip punctuation for comparison."""
    return re.sub(r"[^a-z0-9#+.\- ]", "", text.lower()).strip()


# Common technology keywords to look for in resumes.
# This helps avoid matching generic English words as "technologies".
KNOWN_TECH_KEYWORDS = {
    # Languages
    "python", "java", "javascript", "typescript", "c", "c++", "c#",
    "go", "golang", "rust", "ruby", "php", "swift", "kotlin", "scala",
    "r", "matlab", "julia", "perl", "bash", "shell", "sql", "nosql",
    "html", "css", "sass", "less",
    # Frameworks / libraries
    "react", "angular", "vue", "next.js", "nextjs", "node.js", "nodejs",
    "express", "django", "flask", "fastapi", "spring", "spring boot",
    ".net", "asp.net", "rails", "laravel", "svelte", "nuxt",
    "pandas", "numpy", "scipy", "scikit-learn", "sklearn",
    "tensorflow", "pytorch", "keras", "opencv",
    "pyspark", "spark", "hadoop", "airflow",
    # Cloud / infra
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "ansible", "jenkins", "ci/cd", "cicd", "git", "github",
    "gitlab", "linux", "unix",
    # Data / DB
    "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis",
    "elasticsearch", "dynamodb", "bigquery", "snowflake", "databricks",
    "tableau", "power bi", "powerbi", "looker",
    # AI/ML
    "machine learning", "deep learning", "nlp", "natural language processing",
    "computer vision", "ai", "ai/ml", "llm", "generative ai",
    "data science", "data engineering", "data analysis",
    # Other
    "rest", "restful", "graphql", "api", "microservices",
    "agile", "scrum", "jira",
}


def _extract_resume_keywords(resume_path: Path) -> set[str]:
    """
    Read a PDF resume and extract a set of normalized technology keywords.
    Results are cached per file path for the duration of the session.
    """
    key = str(resume_path.resolve())
    if key in _resume_cache:
        return _resume_cache[key]

    try:
        reader = PdfReader(str(resume_path))
    except Exception as e:
        console.print(f"[red]Could not read resume PDF:[/red] {e}")
        return set()

    full_text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            full_text += extracted + "\n"

    normalized = _normalize(full_text)

    # Find known tech keywords present in the resume text
    found = set()
    for kw in KNOWN_TECH_KEYWORDS:
        # Use word-boundary matching to avoid partial matches
        pattern = r"(?:^|[\s,;/|(])" + re.escape(kw) + r"(?:$|[\s,;/|)])"
        if re.search(pattern, normalized):
            found.add(kw)

    _resume_cache[key] = found
    return found


# ──────────────────── attainability computation ────────────────────

def _parse_job_technologies(tech_string: str | None) -> set[str]:
    """Split the comma-separated technologies field into normalized keywords."""
    if not tech_string:
        return set()
    raw_items = [t.strip() for t in tech_string.split(",")]
    result = set()
    for item in raw_items:
        normed = _normalize(item)
        if normed:
            result.add(normed)
    return result


def compute_attainability(resume_path: Path, job_row: dict) -> int:
    """
    Compare resume keywords against job data and return a 1-10 score.
    10 = most attainable, 1 = least attainable.

    Weights:
        Technology overlap   60%
        Location compat.     20%
        Job type fit         10%
        Status signal        10%
    """
    resume_keywords = _extract_resume_keywords(resume_path)
    if not resume_keywords:
        # Can't score without resume data — return midpoint
        return 5

    # ── 1. Technology overlap (60%) ──
    job_techs = _parse_job_technologies(job_row.get("technologies"))
    if job_techs:
        # Count how many job-required techs the resume covers
        matched = sum(1 for jt in job_techs if jt in resume_keywords)
        tech_ratio = matched / len(job_techs)
    else:
        # No technologies listed — assume neutral
        tech_ratio = 0.5

    tech_score = tech_ratio * 10.0  # 0-10 scale

    # ── 2. Location compatibility (20%) ──
    location = _normalize(job_row.get("location") or "")
    if not location:
        loc_score = 5.0  # unknown — neutral
    elif "remote" in location:
        loc_score = 10.0  # remote is always attainable
    elif "hybrid" in location:
        loc_score = 7.0
    else:
        # In-person — slight penalty, resume can't tell us where user lives
        loc_score = 5.0

    # ── 3. Job type fit (10%) ──
    job_type = _normalize(job_row.get("job_type") or "")
    resume_text_lower = " ".join(resume_keywords)
    if not job_type:
        type_score = 5.0
    elif "intern" in job_type:
        # If resume mentions intern-related keywords, good fit
        type_score = 7.0
    elif "full-time" in job_type or "full time" in job_type:
        type_score = 6.0
    elif "part-time" in job_type or "part time" in job_type:
        type_score = 5.0
    elif "contract" in job_type:
        type_score = 5.0
    else:
        type_score = 5.0

    # ── 4. Status signal (10%) ──
    status = _normalize(job_row.get("status") or "")
    status_scores = {
        "offer": 10.0,
        "technical": 8.0,
        "interviewing": 7.0,
        "screening": 6.0,
        "applied": 5.0,
        "withdrawn": 4.0,
        "ghosted": 2.0,
        "rejected": 1.0,
    }
    stat_score = status_scores.get(status, 5.0)

    # ── Weighted combination ──
    raw = (
        tech_score * 0.60
        + loc_score * 0.20
        + type_score * 0.10
        + stat_score * 0.10
    )

    # Clamp to 1-10 integer
    return max(1, min(10, round(raw)))


def score_application(app_row: dict, resumes_dir: Path | None = None) -> int | None:
    """
    Convenience wrapper: given a full application row (dict),
    locate the resume file and compute attainability.
    Returns None if no resume is linked or file not found.
    """
    resume_name = app_row.get("resume_used")
    if not resume_name:
        return None

    if resumes_dir is None:
        resumes_dir = Path("resumes")

    resume_path = resumes_dir / resume_name
    if not resume_path.exists():
        return None

    return compute_attainability(resume_path, app_row)
