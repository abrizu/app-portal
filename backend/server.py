import sys
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure we can import from functions directory
sys.path.append(str(Path(__file__).parent))

from functions.core.db import get_connection
import os
from datetime import date
from functions.scoring.attainability import score_application

class ApplicationCreate(BaseModel):
    job_title: str
    company_name: str
    posting_date: str | None = None
    application_date: str | None = None
    status: str = "Applied"
    technologies: str | None = None
    posting_url: str | None = None
    location: str | None = None
    job_type: str = "Full-time"
    salary_range: str | None = None
    source: str | None = None
    resume_used: str | None = None
    priority_score: int | None = None
    notes: str | None = None
app = FastAPI(title="App Portal API", description="Backend API for Job Application Tracker")

# Setup CORS for the Vite frontend (Phase 2 & 3)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "FastAPI is running!"}

@app.get("/api/applications")
def get_applications():
    """Returns a list of all job applications from the SQLite database."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM applications ORDER BY company_name ASC")
        # Convert sqlite3.Row to standard dict for JSON serialization
        apps = [dict(row) for row in cur.fetchall()]
        conn.close()
        return {"success": True, "applications": apps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resumes")
def get_resumes():
    resumes_dir = Path(__file__).parent / "resumes"
    if not resumes_dir.exists():
        return {"resumes": []}
    return {"resumes": [f.name for f in resumes_dir.glob("*") if f.is_file() and f.name != ".gitkeep"]}

@app.post("/api/applications")
def create_application(app_in: ApplicationCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        app_date = app_in.application_date or str(date.today())
        
        cur.execute("""
            INSERT INTO applications
                (job_title, company_name, posting_date, application_date, status,
                 technologies, posting_url, location, job_type, salary_range, source, resume_used,
                 priority_score, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_in.job_title, app_in.company_name, app_in.posting_date, app_date, app_in.status,
            app_in.technologies, app_in.posting_url, app_in.location, app_in.job_type,
            app_in.salary_range, app_in.source, app_in.resume_used, app_in.priority_score, app_in.notes,
        ))
        new_id = cur.lastrowid
        conn.commit()

        # Auto-compute attainability
        app_data = {
            "technologies": app_in.technologies, "location": app_in.location,
            "job_type": app_in.job_type, "status": app_in.status, "resume_used": app_in.resume_used,
        }
        att_score = score_application(app_data)
        if att_score is not None:
            cur.execute("UPDATE applications SET attainability_score = ? WHERE id = ?;", (att_score, new_id))
            conn.commit()

        cur.close()
        conn.close()
        return {"success": True, "id": new_id, "attainability_score": att_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/applications/{app_id}")
def get_application(app_id: int):
    """Returns a single application by ID."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        row = cur.fetchone()
        conn.close()
        if row is None:
            raise HTTPException(status_code=404, detail="Application not found")
        return {"success": True, "application": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ApplicationUpdate(BaseModel):
    job_title: str | None = None
    company_name: str | None = None
    posting_date: str | None = None
    application_date: str | None = None
    status: str | None = None
    technologies: str | None = None
    posting_url: str | None = None
    location: str | None = None
    job_type: str | None = None
    salary_range: str | None = None
    source: str | None = None
    resume_used: str | None = None
    priority_score: int | None = None
    notes: str | None = None

@app.put("/api/applications/{app_id}")
def update_application(app_id: int, app_in: ApplicationUpdate):
    """Updates an existing application (partial update)."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Only update fields that are provided
        update_data = {k: v for k, v in app_in.model_dump().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clause = ", ".join(f"{k} = ?" for k in update_data.keys())
        values = list(update_data.values()) + [app_id]
        cur.execute(f"UPDATE applications SET {set_clause} WHERE id = ?", values)
        conn.commit()

        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Application not found")

        # Re-compute attainability score
        cur.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        row = cur.fetchone()
        app_data = dict(row)
        att_score = score_application(app_data)
        if att_score is not None:
            cur.execute("UPDATE applications SET attainability_score = ? WHERE id = ?;", (att_score, app_id))
            conn.commit()

        cur.close()
        conn.close()
        return {"success": True, "id": app_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/applications/{app_id}")
def delete_application(app_id: int):
    """Deletes an application by ID."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM applications WHERE id = ?", (app_id,))
        conn.commit()
        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Application not found")
        cur.close()
        conn.close()
        return {"success": True, "id": app_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
