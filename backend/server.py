import sys
from pathlib import Path
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ensure we can import from functions directory
sys.path.append(str(Path(__file__).parent))

from functions.core.db import get_connection

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

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
