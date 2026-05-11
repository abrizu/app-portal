import sys
import secrets
import string
import shutil
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure we can import from functions directory
sys.path.append(str(Path(__file__).parent))

from functions.core.db import get_connection, initialize_database
from functions.auth import get_password_hash, verify_password, create_access_token, decode_access_token
from fastapi.responses import FileResponse
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
    work_type: str | None = None
    job_type: str = "Full-time"
    salary_range: str | None = None
    source: str | None = None
    resume_used: str | None = None
    priority_score: int | None = None
    notes: str | None = None
    app_username: str | None = None
    app_password: str | None = None
app = FastAPI(title="App Portal API", description="Backend API for Job Application Tracker")

# Setup CORS for the Vite frontend (Phase 2 & 3)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=False,  # Must be False when allow_origins=["*"] (CORS spec)
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """Ensure all DB tables exist before handling any requests."""
    initialize_database()

@app.get("/api/health")
def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "message": "FastAPI is running!"}

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    return payload.get("sub")

class UserLogin(BaseModel):
    username: str
    password: str

@app.get("/api/auth/check")
def check_auth():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as count FROM users")
    row = cur.fetchone()
    conn.close()
    return {"has_users": row['count'] > 0}

@app.post("/api/auth/register")
def register_user(user: UserLogin):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as count FROM users")
    if cur.fetchone()['count'] > 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Admin user already exists")
    
    hashed_pw = get_password_hash(user.password)
    cur.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (user.username, hashed_pw))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/auth/login")
def login(user: UserLogin):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = ?", (user.username,))
    db_user = cur.fetchone()
    conn.close()
    
    if not db_user or not verify_password(user.password, db_user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    access_token = create_access_token(data={"sub": db_user['username']})
    return {"access_token": access_token, "token_type": "bearer"}

_PW_ALPHABET = string.ascii_letters + string.digits + "!@#$%^&*()-_=+[]{}|;:,.<>?"

@app.get("/api/generate-password")
def generate_password():
    """Return a random 16-char password with guaranteed complexity."""
    while True:
        pw = "".join(secrets.choice(_PW_ALPHABET) for _ in range(16))
        if (any(c in string.ascii_uppercase for c in pw) and
            any(c in string.ascii_lowercase for c in pw) and
            any(c in string.digits for c in pw) and
            any(c not in string.ascii_letters + string.digits for c in pw)):
            return {"password": pw}

from fastapi import Response
import sqlite3

@app.post("/api/resumes/upload")
def upload_resume(file: UploadFile = File(...), user: str = Depends(get_current_user)):
    file_content = file.file.read()
    
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = ?", (user,))
    user_row = cur.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user_row["id"]
    
    try:
        cur.execute("INSERT INTO resumes (user_id, filename, file_data) VALUES (?, ?, ?)", 
                    (user_id, file.filename, file_content))
        conn.commit()
    except sqlite3.IntegrityError:
        # Overwrite if exists for the same user
        cur.execute("UPDATE resumes SET file_data = ? WHERE filename = ? AND user_id = ?", 
                    (file_content, file.filename, user_id))
        conn.commit()
    conn.close()
        
    return {"success": True, "filename": file.filename}

@app.delete("/api/resumes/{filename}")
def delete_resume_endpoint(filename: str, user: str = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM resumes 
        WHERE filename = ? AND user_id = (SELECT id FROM users WHERE username = ?)
    """, (filename, user))
    conn.commit()
    rowcount = cur.rowcount
    conn.close()
    
    if rowcount == 0:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    return {"success": True}

@app.get("/api/resumes/download/{filename}")
def download_resume(filename: str, user: str = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT r.file_data 
        FROM resumes r
        JOIN users u ON r.user_id = u.id
        WHERE r.filename = ? AND u.username = ?
    """, (filename, user))
    row = cur.fetchone()
    conn.close()
    
    if not row or not row["file_data"]:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    return Response(content=row["file_data"], media_type="application/pdf", headers={
        "Content-Disposition": f'inline; filename="{filename}"'
    })

from fastapi import APIRouter
protected_router = APIRouter(dependencies=[Depends(get_current_user)])

class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    home_location: str | None = None

@protected_router.get("/api/users/me")
def get_current_user_profile(username: str = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, first_name, last_name, home_location FROM users WHERE username = ?", (username,))
        row = cur.fetchone()
        conn.close()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        return {"success": True, "user": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@protected_router.put("/api/users/me")
def update_current_user_profile(user_in: UserUpdate, username: str = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        update_data = user_in.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clause = ", ".join(f"{k} = ?" for k in update_data.keys())
        values = list(update_data.values()) + [username]
        
        cur.execute(f"UPDATE users SET {set_clause} WHERE username = ?", values)
        conn.commit()
        
        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
            
        conn.close()
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@protected_router.get("/api/applications")
def get_applications():
    """Returns a list of all job applications from the SQLite database."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM applications ORDER BY application_date DESC, id DESC")
        # Convert sqlite3.Row to standard dict for JSON serialization
        apps = [dict(row) for row in cur.fetchall()]
        conn.close()
        return {"success": True, "applications": apps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@protected_router.get("/api/resumes")
def get_resumes(username: str = Depends(get_current_user)):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT r.filename 
            FROM resumes r
            JOIN users u ON r.user_id = u.id
            WHERE u.username = ?
            ORDER BY r.upload_date DESC
        """, (username,))
        resumes = [row['filename'] for row in cur.fetchall()]
        conn.close()
        return {"resumes": resumes}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"resumes": []}

@protected_router.post("/api/applications")
def create_application(app_in: ApplicationCreate):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        app_date = app_in.application_date or str(date.today())
        
        cur.execute("""
            INSERT INTO applications
                (job_title, company_name, posting_date, application_date, status,
                 technologies, posting_url, location, work_type, job_type, salary_range, source, resume_used,
                 priority_score, notes, app_username, app_password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_in.job_title, app_in.company_name, app_in.posting_date, app_date, app_in.status,
            app_in.technologies, app_in.posting_url, app_in.location, app_in.work_type, app_in.job_type,
            app_in.salary_range, app_in.source, app_in.resume_used, app_in.priority_score, app_in.notes,
            app_in.app_username, app_in.app_password,
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

@protected_router.get("/api/applications/{app_id}")
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
    work_type: str | None = None
    job_type: str | None = None
    salary_range: str | None = None
    source: str | None = None
    resume_used: str | None = None
    priority_score: int | None = None
    notes: str | None = None
    app_username: str | None = None
    app_password: str | None = None

@protected_router.put("/api/applications/{app_id}")
def update_application(app_id: int, app_in: ApplicationUpdate):
    """Updates an existing application (partial update)."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Update fields that were explicitly provided in the request
        update_data = app_in.model_dump(exclude_unset=True)
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

@protected_router.delete("/api/applications/{app_id}")
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

class ApplicationDraft(BaseModel):
    job_title: str | None = None
    company_name: str | None = None
    posting_date: str | None = None
    application_date: str | None = None
    status: str | None = "Draft"
    technologies: str | None = None
    posting_url: str | None = None
    location: str | None = None
    work_type: str | None = None
    job_type: str | None = None
    salary_range: str | None = None
    source: str | None = None
    resume_used: str | None = None
    priority_score: int | None = None
    notes: str | None = None
    app_username: str | None = None
    app_password: str | None = None

@protected_router.get("/api/drafts")
def get_drafts():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM drafts ORDER BY updated_at DESC")
        drafts = [dict(row) for row in cur.fetchall()]
        conn.close()
        return {"success": True, "drafts": drafts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@protected_router.post("/api/drafts")
def create_draft(draft_in: ApplicationDraft):
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO drafts
                (job_title, company_name, posting_date, application_date, status,
                 technologies, posting_url, location, work_type, job_type, salary_range, source, resume_used,
                 priority_score, notes, app_username, app_password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            draft_in.job_title, draft_in.company_name, draft_in.posting_date, draft_in.application_date, draft_in.status,
            draft_in.technologies, draft_in.posting_url, draft_in.location, draft_in.work_type, draft_in.job_type,
            draft_in.salary_range, draft_in.source, draft_in.resume_used, draft_in.priority_score, draft_in.notes,
            draft_in.app_username, draft_in.app_password,
        ))
        new_id = cur.lastrowid
        conn.commit()
        cur.close()
        conn.close()
        return {"success": True, "id": new_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@protected_router.get("/api/drafts/{draft_id}")
def get_draft(draft_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM drafts WHERE id = ?", (draft_id,))
        row = cur.fetchone()
        conn.close()
        if row is None:
            raise HTTPException(status_code=404, detail="Draft not found")
        return {"success": True, "draft": dict(row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@protected_router.put("/api/drafts/{draft_id}")
def update_draft(draft_id: int, draft_in: ApplicationDraft):
    try:
        conn = get_connection()
        cur = conn.cursor()
        update_data = draft_in.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")

        set_clause = ", ".join(f"{k} = ?" for k in update_data.keys())
        values = list(update_data.values()) + [draft_id]
        cur.execute(f"UPDATE drafts SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?", values)
        conn.commit()

        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Draft not found")
        cur.close()
        conn.close()
        return {"success": True, "id": draft_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@protected_router.delete("/api/drafts/{draft_id}")
def delete_draft(draft_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM drafts WHERE id = ?", (draft_id,))
        conn.commit()
        if cur.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Draft not found")
        cur.close()
        conn.close()
        return {"success": True, "id": draft_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(protected_router)

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
