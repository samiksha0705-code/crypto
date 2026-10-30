@echo off
REM PegGuard AI launcher - starts backend (port 8000) and frontend (port 3000)
cd /d "%~dp0"

echo === Setting up backend ===
cd backend
if exist .venv\Scripts\python.exe (
  .venv\Scripts\python.exe -c "import sys" 2>nul || rmdir /s /q .venv
)
if not exist .venv\Scripts\python.exe (
  python -m venv .venv
)
.venv\Scripts\python.exe -m pip install -q -r requirements.txt
start "PegGuard Backend" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"
cd ..

echo === Setting up frontend ===
cd frontend
call npm install
start "PegGuard Frontend" cmd /k "npm run dev"
cd ..

timeout /t 8 >nul
start http://localhost:3000
