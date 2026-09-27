@echo off
cd /d "%~dp0backend"
if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)
echo Starting API on http://127.0.0.1:8010 ...
echo (If data/models are missing, the API auto-generates them on first run - can take ~30s.)
uvicorn app.main:app --reload --port 8010
pause
