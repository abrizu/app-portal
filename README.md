# Job Application Portal

A premium, state-of-the-art job application tracker designed for modern developers. This portal combines a stunning **glassmorphic** web interface with a powerful **CLI** for maximum flexibility in tracking your career journey.

![Dashboard Overview](https://github.com/user-attachments/assets/placeholder)

## Core Features

### Simple Web Interface
- **Dynamic Dashboard**: Real-time statistics, application status distributions, and active application lists.
- **Glassmorphic Design**: A premium, transparent UI with vibrant accents and smooth animations.
- **CRUD Management**: Easily create, edit, view, and delete job applications.
- **Draft System**: Save in-progress applications before they are officially submitted.
- **Resume Portal**: Centralized management for your resumes with easy upload and download capabilities.

### Powerful Backend & Logic
- **Attainability Scoring**: Automatic calculation of "Attainability" based on job type, location, and technologies. (Available on CLI, integration TBD for frontend app.)
- **Secure Authentication**: Robust JWT-based authentication system with `bcrypt` password hashing.
- **Credential Vault**: Store application-specific usernames and passwords securely within each application record.
- **Smart Passwords**: Built-in guaranteed-complexity password generator for new account creation.

---

## Quick Start

The easiest way to get the portal running on Windows is using the provided startup script:

1. **Clone the repository** and navigate to the directory.
2. **Execute the runner**:
   ```powershell
   .\run.ps1
   ```
   *This script automatically starts both the FastAPI backend and the Vite frontend.*

---

## Usage Modes (In Progress)

### Frontend Web App (Primary)
Access the current UI at `http://localhost:5173`. (Official deployment in development, will soon be hosted as a webpage.)
- **First Run**: If no users exist, you will be prompted to create an Admin account.
- **Secure Login**: Session-based auth with automatic timeout/invalidation handling.

### Interactive CLI
For power users who prefer the terminal, a full-featured CLI is available:
```bash
# Ensure your virtual environment is active
python main.py
```
- Manage applications directly through the terminal.
- Quick user management and system status checks.

---

## Manual Setup

### 1. Prerequisites
- **Python**: 3.10 or higher
- **Node.js**: Latest LTS version
- **npm**: Included with Node.js

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
.venv/Scripts/activate # Windows
source .venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn backend.server:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## Future Roadmap

I am continuously evolving the portal. Key upcoming features include:

- [ ] **Agentic Job Search**: Integration with LLM agents (like OpenClaw) to automatically discover and recommend jobs matching your resume.
- [ ] **Dockerization**: Containerizing the entire stack for seamless, one-click deployment.
- [ ] **Advanced Analytics**: GitHub-style contribution graphs for daily application activity and conversion rate metrics.
- [ ] **Mobile Integration**: SMS/Push notifications for new job matches and upcoming interview reminders.
- [ ] **Geospatial Intelligence**: Integration with maps to show job proximity based on user demographics.
- [ ] **Freshness Warnings**: Visual indicators for job postings that are getting old (1 week = Green, 4 weeks = Red).

---

## Tech Stack

- **Backend**: FastAPI (Python), SQLite3, Passlib, PyJWT
- **Frontend**: Vite, Vanilla JavaScript, Premium CSS3
- **Tooling**: PowerShell scripts for rapid development, Rich for CLI aesthetics

---

