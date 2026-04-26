# Running server on 8000, and vite on 5173.

# 1. Start the Backend
Start-Process powershell -ArgumentList "-Command", "if (Test-Path .venv) { . .venv\Scripts\Activate.ps1 }; `$env:PYTHONPATH='backend'; python backend/server.py"

# 2. Start the Frontend
Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev"

Write-Host "Starting App Portal..." -ForegroundColor Cyan
Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Frontend: Check the second window for the URL" -ForegroundColor Green