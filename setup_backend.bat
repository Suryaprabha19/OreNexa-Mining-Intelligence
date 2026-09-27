@echo off
echo === MOIL Reserve Intelligence: Backend Setup ===
cd /d "%~dp0backend"

python -m venv .venv
if not exist ".venv\Scripts\activate.bat" (
    echo [WARN] Could not create a virtual environment - continuing with the system Python instead.
    echo         Make sure "python" and "pip" on your PATH point to Python 3.10+.
) else (
    call .venv\Scripts\activate.bat
)

echo.
echo Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] pip install failed - see the message above.
    pause
    exit /b 1
)

echo.
echo Generating synthetic data and training models...
python setup.py
if errorlevel 1 (
    echo [ERROR] setup.py failed - see the message above.
    pause
    exit /b 1
)

echo.
echo Setup complete. Run start_backend.bat to launch the API.
pause
